import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireAdmin } from '../_shared/adminAuth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const KINGUIN_API_URL = 'https://gateway.kinguin.net/esa/api/v1'
const ALLOWED_REGIONS = [3, 1] // Worldwide, Europe
const PAGE_SIZE = 100

// Bounded work per invocation. Kinguin is walked newest-first and we stop as
// soon as we reach products we already have, so a caught-up catalogue costs one
// page per region. The cap only matters when the watermark is far behind, and
// it keeps a single run inside the edge runtime's CPU budget — exceeding it
// kills the isolate mid-flight, which previously meant the watermark was never
// advanced and every subsequent run repeated the same doomed walk.
//
// Measured: 16 pages of bulk upserts finish in a couple of seconds, nowhere
// near the limit, because the time is network wait rather than CPU. Kinguin
// churns fast enough that an hour of changes can still exceed this — watch for
// `caughtUp: false` in the log if the webhook is not registered yet.
const MAX_PAGES_PER_REGION = 20

interface SyncProgress {
  synced: number
  newestTimestamp: string
  pagesFetched: number
  reachedEnd: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Rewrites the catalogue and burns Kinguin API quota — admins and the cron
  // (which presents the service role key) only.
  const auth = await requireAdmin(req, corsHeaders)
  if (!auth.ok) return auth.response!

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const releaseLock = () =>
    supabase
      .from('store_settings')
      .update({ value: { locked: false, started_at: null, function: null } })
      .eq('key', 'sync_lock')

  try {
    const kinguinApiKey = Deno.env.get('KINGUIN_API_KEY')
    if (!kinguinApiKey) throw new Error('KINGUIN_API_KEY not configured')

    const { data: autoSyncSetting } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'auto_sync_enabled')
      .maybeSingle()

    if (autoSyncSetting?.value === false) {
      return new Response(JSON.stringify({ skipped: true, reason: 'Auto-sync disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: lockData } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'sync_lock')
      .maybeSingle()

    const lock = lockData?.value || { locked: false }
    if (lock.locked) {
      const lockAge = Date.now() - new Date(lock.started_at).getTime()
      const MAX_LOCK_AGE_MS = 15 * 60 * 1000
      if (lockAge < MAX_LOCK_AGE_MS) {
        return new Response(
          JSON.stringify({ skipped: true, reason: 'Sync already in progress', started_at: lock.started_at }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      console.log('Stale lock detected, proceeding anyway')
    }

    await supabase
      .from('store_settings')
      .update({ value: { locked: true, started_at: new Date().toISOString(), function: 'kinguin-auto-sync' } })
      .eq('key', 'sync_lock')

    const { data: watermarkRow } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'last_kinguin_sync_timestamp')
      .maybeSingle()

    // The stored value has been double-encoded at various points in this
    // project's history, so strip quotes rather than trusting the shape.
    const lastSyncTimestamp = String(watermarkRow?.value ?? '2020-01-01T00:00:00Z').replace(/^"+|"+$/g, '').replace(/\\"/g, '')
    const lastSyncMs = new Date(lastSyncTimestamp).getTime()

    console.log(`Incremental sync. Watermark: ${lastSyncTimestamp}`)

    const progress: SyncProgress = {
      synced: 0,
      newestTimestamp: lastSyncTimestamp,
      pagesFetched: 0,
      reachedEnd: true,
    }

    for (const regionId of ALLOWED_REGIONS) {
      for (let page = 1; page <= MAX_PAGES_PER_REGION; page++) {
        const url = `${KINGUIN_API_URL}/products?regionId=${regionId}&page=${page}&limit=${PAGE_SIZE}&sortBy=updatedAt&sortType=desc`
        const response = await fetch(url, {
          headers: { 'X-Api-Key': kinguinApiKey, 'Content-Type': 'application/json' },
        })

        if (!response.ok) {
          console.error(`Kinguin API error for region ${regionId} page ${page}: ${response.status}`)
          break
        }

        const data = await response.json()
        const products = data.results || data.products || data || []
        progress.pagesFetched++
        if (products.length === 0) break

        // Newest-first, so everything from the first already-known product
        // onwards is already in the catalogue.
        const fresh: any[] = []
        let hitKnown = false
        for (const product of products) {
          const updatedAt = product.updatedAt || product.updated_at || '2020-01-01T00:00:00Z'
          if (new Date(updatedAt).getTime() <= lastSyncMs) {
            hitKnown = true
            break
          }
          if (new Date(updatedAt).getTime() > new Date(progress.newestTimestamp).getTime()) {
            progress.newestTimestamp = updatedAt
          }
          fresh.push(product)
        }

        if (fresh.length > 0) {
          // One bulk upsert per page. The previous version issued a SELECT and
          // an UPSERT per product purely to report new-vs-updated counts, which
          // is what blew the CPU budget.
          const rows = fresh.map((product: any) => {
            const price = parseFloat(product.price || 0)
            const qty = product.qty || 0
            return {
              kinguin_id: product.kinguinId,
              product_id: product.productId,
              name: product.name,
              description: product.description,
              cover_image: product.coverImage || product.images?.cover?.url,
              screenshots: product.screenshots?.map((s: any) => s.url) || [],
              original_price: price,
              sell_price: price,
              platform: product.platform,
              genres: product.genres || [],
              release_date: product.releaseDate,
              region_id: product.regionId,
              region_name: product.region?.name || (product.regionId === 3 ? 'Worldwide' : 'Europe'),
              is_available: qty > 0,
              qty,
              updated_at: new Date().toISOString(),
            }
          })

          const { error } = await supabase
            .from('kinguin_products')
            .upsert(rows, { onConflict: 'kinguin_id' })

          if (error) {
            console.error(`Upsert failed for region ${regionId} page ${page}:`, error)
          } else {
            progress.synced += rows.length
          }
        }

        if (hitKnown || products.length < PAGE_SIZE) break
        if (page === MAX_PAGES_PER_REGION) progress.reachedEnd = false
      }
    }

    // This is a rolling window over the newest pages, not a resumable cursor:
    // Kinguin is sorted newest-first, so a run that hits the page cap leaves the
    // older tail of that gap unsynced and the next run starts from the top
    // again. That is a deliberate trade for bounded, predictable runs — the
    // product.update webhook is what keeps individual titles current, and this
    // job is the backstop. `caughtUp: false` in the log means the window was too
    // small for the hour's churn; re-run kinguin-backfill if it persists.
    await supabase
      .from('store_settings')
      .update({ value: progress.newestTimestamp })
      .eq('key', 'last_kinguin_sync_timestamp')

    await releaseLock()

    console.log(`Sync done. Synced ${progress.synced} across ${progress.pagesFetched} pages.`)

    return new Response(
      JSON.stringify({
        success: true,
        synced: progress.synced,
        pagesFetched: progress.pagesFetched,
        caughtUp: progress.reachedEnd,
        lastSyncTimestamp: progress.newestTimestamp,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Auto-sync error:', error)
    try {
      await releaseLock()
    } catch (e) {
      console.error('Failed to release lock:', e)
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

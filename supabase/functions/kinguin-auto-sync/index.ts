import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const KINGUIN_API_URL = 'https://gateway.kinguin.net/esa/api/v1'
const ALLOWED_REGIONS = [3, 1] // Worldwide, Europe

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const kinguinApiKey = Deno.env.get('KINGUIN_API_KEY')
    if (!kinguinApiKey) {
      throw new Error('KINGUIN_API_KEY not configured')
    }

    // Check if auto-sync is enabled
    const { data: autoSyncSetting } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'auto_sync_enabled')
      .maybeSingle()

    if (autoSyncSetting?.value === false) {
      console.log('Auto-sync is disabled, skipping')
      return new Response(JSON.stringify({ skipped: true, reason: 'Auto-sync disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check sync lock to prevent overlapping runs
    const { data: lockData } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'sync_lock')
      .maybeSingle()

    const lock = lockData?.value || { locked: false }

    if (lock.locked) {
      const lockAge = Date.now() - new Date(lock.started_at).getTime()
      const MAX_LOCK_AGE_MS = 30 * 60 * 1000 // 30 minutes max

      if (lockAge < MAX_LOCK_AGE_MS) {
        console.log(`Sync already in progress (started ${Math.round(lockAge / 1000)}s ago), skipping`)
        return new Response(
          JSON.stringify({ skipped: true, reason: 'Sync already in progress', started_at: lock.started_at }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      console.log('Stale lock detected (>30 min), proceeding anyway')
    }

    // Acquire lock
    await supabase
      .from('store_settings')
      .update({ value: { locked: true, started_at: new Date().toISOString(), function: 'kinguin-auto-sync' } })
      .eq('key', 'sync_lock')

    // Get last sync timestamp
    const { data: settings } = await supabase
      .from('store_settings')
      .select('key, value')
      .eq('key', 'last_kinguin_sync_timestamp')

    let lastSyncTimestamp = '2020-01-01T00:00:00Z'
    if (settings) {
      for (const s of settings) {
        if (s.key === 'last_kinguin_sync_timestamp') {
          lastSyncTimestamp = String(s.value).replace(/"/g, '')
        }
      }
    }

    console.log(`Starting incremental sync. Last sync: ${lastSyncTimestamp}`)

    let totalNewProducts = 0
    let totalUpdatedProducts = 0
    let newestTimestamp = lastSyncTimestamp
    const limit = 100
    const maxPages = 50 // Safety limit

    // Fetch products sorted by updatedAt DESC, stop when we hit old products
    for (const regionId of ALLOWED_REGIONS) {
      let page = 1
      let foundOldProducts = false

      while (page <= maxPages && !foundOldProducts) {
        const kinguinUrl = `${KINGUIN_API_URL}/products?regionId=${regionId}&page=${page}&limit=${limit}&sortBy=updatedAt&sortType=desc`

        const response = await fetch(kinguinUrl, {
          headers: { 'X-Api-Key': kinguinApiKey, 'Content-Type': 'application/json' },
        })

        if (!response.ok) {
          console.error(`Kinguin API error: ${response.status}`)
          break
        }

        const data = await response.json()
        const products = data.results || data.products || data || []
        if (products.length === 0) break

        for (const product of products) {
          const productUpdatedAt = product.updatedAt || product.updated_at || '2020-01-01T00:00:00Z'

          if (new Date(productUpdatedAt) <= new Date(lastSyncTimestamp)) {
            foundOldProducts = true
            break
          }

          if (new Date(productUpdatedAt) > new Date(newestTimestamp)) {
            newestTimestamp = productUpdatedAt
          }

          const { data: existing } = await supabase
            .from('kinguin_products')
            .select('id')
            .eq('kinguin_id', product.kinguinId)
            .maybeSingle()

          const price = parseFloat(product.price || 0)
          const qty = product.qty || 0

          const productData = {
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
            qty: qty,
            updated_at: new Date().toISOString(),
          }

          const { error } = await supabase
            .from('kinguin_products')
            .upsert(productData, { onConflict: 'kinguin_id' })

          if (error) {
            console.error(`Error upserting product ${product.kinguinId}:`, error)
            continue
          }

          if (existing) {
            totalUpdatedProducts++
          } else {
            totalNewProducts++
          }
        }

        if (products.length < limit) break
        page++
      }
    }

    // Update last sync timestamp
    await supabase
      .from('store_settings')
      .update({ value: JSON.stringify(newestTimestamp) })
      .eq('key', 'last_kinguin_sync_timestamp')

    // Release lock
    await supabase
      .from('store_settings')
      .update({ value: { locked: false, started_at: null, function: null } })
      .eq('key', 'sync_lock')

    console.log(`Sync complete. New: ${totalNewProducts}, Updated: ${totalUpdatedProducts}`)

    return new Response(
      JSON.stringify({
        success: true,
        newProducts: totalNewProducts,
        updatedProducts: totalUpdatedProducts,
        lastSyncTimestamp: newestTimestamp,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Auto-sync error:', error)

    // Release lock on error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)
      await supabase
        .from('store_settings')
        .update({ value: { locked: false, started_at: null, function: null } })
        .eq('key', 'sync_lock')
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

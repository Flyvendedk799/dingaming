import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireAdmin } from '../_shared/adminAuth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const KINGUIN_API_URL = 'https://gateway.kinguin.net/esa/api/v1'
const ALLOWED_REGIONS = [3, 1] // Worldwide, Europe
const PRODUCTS_PER_PAGE = 100
const PAGES_PER_RUN = 20 // Process 20 pages (2000 products) per run
const PARALLEL_REQUESTS = 5 // Fetch 5 pages in parallel

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Walks the entire Kinguin catalogue — expensive, admins and the cron only.
  const auth = await requireAdmin(req, corsHeaders)
  if (!auth.ok) return auth.response!

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const kinguinApiKey = Deno.env.get('KINGUIN_API_KEY')
    
    if (!kinguinApiKey) {
      throw new Error('KINGUIN_API_KEY not configured')
    }

    // Check if backfill is already complete
    const { data: backfillComplete } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'backfill_complete')
      .maybeSingle()

    if (backfillComplete?.value === true || backfillComplete?.value === 'true') {
      console.log('Backfill already complete')
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Backfill already complete',
        complete: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check sync lock
    const { data: lockData } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'sync_lock')
      .maybeSingle()

    const lock = lockData?.value || { locked: false }
    
    if (lock.locked) {
      const lockAge = Date.now() - new Date(lock.started_at).getTime()
      const MAX_LOCK_AGE_MS = 30 * 60 * 1000

      if (lockAge < MAX_LOCK_AGE_MS) {
        console.log('Another sync in progress, skipping backfill')
        return new Response(JSON.stringify({ 
          skipped: true, 
          reason: 'Another sync in progress'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Acquire lock
    await supabase
      .from('store_settings')
      .update({ 
        value: { 
          locked: true, 
          started_at: new Date().toISOString(),
          function: 'kinguin-backfill'
        }
      })
      .eq('key', 'sync_lock')

    // Get saved page - don't try to estimate from kinguin_id since pagination is by count, not ID
    const { data: lastPageData } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'backfill_last_page')
      .maybeSingle()

    let currentPage = Number(lastPageData?.value) || 1

    console.log(`Starting backfill from page ${currentPage}`)

    let totalSynced = 0
    let emptyPages = 0
    const maxEmptyPages = 3

    // Helper function to fetch a single page for a region
    async function fetchPage(page: number, regionId: number): Promise<any[]> {
      const kinguinUrl = `${KINGUIN_API_URL}/products?regionId=${regionId}&page=${page}&limit=${PRODUCTS_PER_PAGE}&sortBy=kinguinId&sortType=asc`
      
      try {
        const response = await fetch(kinguinUrl, {
          headers: {
            'X-Api-Key': kinguinApiKey!,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          console.error(`Kinguin API error for page ${page}, region ${regionId}: ${response.status}`)
          return []
        }

        const data = await response.json()
        return data.results || data.products || data || []
      } catch (e) {
        console.error(`Fetch error page ${page}, region ${regionId}:`, e)
        return []
      }
    }

    // Process pages in parallel batches
    for (let batch = 0; batch < Math.ceil(PAGES_PER_RUN / PARALLEL_REQUESTS) && emptyPages < maxEmptyPages; batch++) {
      const pagesToFetch: number[] = []
      for (let i = 0; i < PARALLEL_REQUESTS && (batch * PARALLEL_REQUESTS + i) < PAGES_PER_RUN; i++) {
        pagesToFetch.push(currentPage + batch * PARALLEL_REQUESTS + i)
      }

      console.log(`Fetching pages in parallel: ${pagesToFetch.join(', ')}`)

      // Fetch all pages for all regions in parallel
      const fetchPromises = pagesToFetch.flatMap(page => 
        ALLOWED_REGIONS.map(regionId => fetchPage(page, regionId).then(products => ({ page, regionId, products })))
      )

      const results = await Promise.all(fetchPromises)

      // Group by page to check for empty pages
      const pageResults = new Map<number, any[]>()
      for (const { page, products } of results) {
        if (!pageResults.has(page)) pageResults.set(page, [])
        pageResults.get(page)!.push(...products)
      }

      // Process each page's results
      for (const page of pagesToFetch) {
        const allProducts = pageResults.get(page) || []
        
        if (allProducts.length === 0) {
          emptyPages++
          console.log(`Empty page ${page}, empty count: ${emptyPages}`)
          if (emptyPages >= maxEmptyPages) break
        } else {
          emptyPages = 0

          // Upsert products. Third and last copy of this mapping — screenshots
          // live under `images.screenshots`, and writing the wrong field here
          // would blank media across the whole catalogue, since this function
          // walks every page.
          const productsToUpsert = allProducts.map((product: any) => {
            const shots = Array.isArray(product.images?.screenshots) ? product.images.screenshots : []
            return {
            kinguin_id: product.kinguinId,
            product_id: product.productId,
            name: product.name,
            description: product.description,
            cover_image: product.coverImage || product.images?.cover?.url,
            screenshots: shots.map((s: any) => s?.url).filter(Boolean),
            screenshot_thumbs: shots.map((s: any) => s?.thumbnail || s?.url || '').filter(Boolean),
            videos: (Array.isArray(product.videos) ? product.videos : [])
              .filter((v: any) => v?.video_id)
              .map((v: any) => ({
                id: v.video_id,
                url: v.video_url || `https://www.youtube.com/watch?v=${v.video_id}`,
              })),
            original_price: parseFloat(product.price || 0),
            sell_price: parseFloat(product.price || 0),
            platform: product.platform,
            genres: product.genres || [],
            release_date: product.releaseDate,
            region_id: product.regionId,
            region_name: product.region?.name || (product.regionId === 3 ? 'Worldwide' : 'Europe'),
            is_available: (product.qty || 0) > 0,
            qty: product.qty || 0,
            updated_at: new Date().toISOString()
            }
          })

          const { error } = await supabase
            .from('kinguin_products')
            .upsert(productsToUpsert, { onConflict: 'kinguin_id' })

          if (error) {
            console.error(`Error upserting page ${page}:`, error)
          } else {
            totalSynced += allProducts.length
          }
        }
      }

      currentPage = pagesToFetch[pagesToFetch.length - 1] + 1
    }

    // Check if we've reached the end
    const isComplete = emptyPages >= maxEmptyPages

    // Save progress
    await supabase
      .from('store_settings')
      .update({ value: currentPage })
      .eq('key', 'backfill_last_page')

    if (isComplete) {
      await supabase
        .from('store_settings')
        .update({ value: true })
        .eq('key', 'backfill_complete')
      
      console.log('Backfill complete!')
    }

    // Release lock
    await supabase
      .from('store_settings')
      .update({ value: { locked: false, started_at: null, function: null } })
      .eq('key', 'sync_lock')

    console.log(`Backfill run complete. Synced ${totalSynced} products. Next page: ${currentPage}. Complete: ${isComplete}`)

    return new Response(JSON.stringify({
      success: true,
      synced: totalSynced,
      nextPage: currentPage,
      complete: isComplete
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Backfill error:', error)
    
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

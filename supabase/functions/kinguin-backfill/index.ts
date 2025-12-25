import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const KINGUIN_API_URL = 'https://gateway.kinguin.net/esa/api/v1'
const ALLOWED_REGIONS = [3, 1] // Worldwide, Europe
const PRODUCTS_PER_PAGE = 100
const PAGES_PER_RUN = 10 // Process 10 pages (1000 products) per run to avoid timeout

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

    // Get last page we processed
    const { data: lastPageData } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'backfill_last_page')
      .maybeSingle()

    let currentPage = Number(lastPageData?.value) || 1

    console.log(`Starting backfill from page ${currentPage}`)

    let totalSynced = 0
    let emptyPages = 0
    const maxEmptyPages = 3 // Stop after 3 consecutive empty pages

    for (let i = 0; i < PAGES_PER_RUN && emptyPages < maxEmptyPages; i++) {
      let pageProducts = 0

      for (const regionId of ALLOWED_REGIONS) {
        const kinguinUrl = `${KINGUIN_API_URL}/products?regionId=${regionId}&page=${currentPage}&limit=${PRODUCTS_PER_PAGE}&sortBy=kinguinId&sortType=asc`
        
        console.log(`Fetching region ${regionId}, page ${currentPage}`)
        
        const response = await fetch(kinguinUrl, {
          headers: {
            'X-Api-Key': kinguinApiKey,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          console.error(`Kinguin API error: ${response.status}`)
          continue
        }

        const data = await response.json()
        const products = data.results || data.products || data || []
        
        if (products.length === 0) continue

        pageProducts += products.length

        // Upsert products
        const productsToUpsert = products.map((product: any) => ({
          kinguin_id: product.kinguinId,
          product_id: product.productId,
          name: product.name,
          description: product.description,
          cover_image: product.coverImage || product.images?.cover?.url,
          screenshots: product.screenshots?.map((s: any) => s.url) || [],
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
        }))

        const { error } = await supabase
          .from('kinguin_products')
          .upsert(productsToUpsert, { onConflict: 'kinguin_id' })

        if (error) {
          console.error(`Error upserting page ${currentPage}:`, error)
        } else {
          totalSynced += products.length
        }
      }

      if (pageProducts === 0) {
        emptyPages++
        console.log(`Empty page ${currentPage}, empty count: ${emptyPages}`)
      } else {
        emptyPages = 0
      }

      currentPage++
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

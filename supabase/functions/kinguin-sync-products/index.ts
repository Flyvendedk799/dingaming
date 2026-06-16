import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const KINGUIN_API_URL = 'https://gateway.kinguin.net/esa/api/v1'
const DEFAULT_MARGIN = 1.30 // 30% margin, used as the stored sell_price baseline

// Region IDs: 3 = Region Free (Worldwide), 1 = Europe
const ALLOWED_REGIONS = [3, 1]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const kinguinApiKey = Deno.env.get('KINGUIN_API_KEY')
    if (!kinguinApiKey) {
      throw new Error('KINGUIN_API_KEY not configured')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    console.log(`Syncing Kinguin products - page ${page}, limit ${limit}`)

    let allProducts: any[] = []

    // Fetch products for each allowed region
    for (const regionId of ALLOWED_REGIONS) {
      const kinguinUrl = `${KINGUIN_API_URL}/products?regionId=${regionId}&page=${page}&limit=${limit}&sortBy=updatedAt&sortType=desc`

      const response = await fetch(kinguinUrl, {
        headers: {
          'X-Api-Key': kinguinApiKey,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Kinguin API error for region ${regionId}:`, response.status, errorText)
        continue
      }

      const data = await response.json()
      const products = data.results || data.products || data || []
      console.log(`Fetched ${products.length} products for region ${regionId}`)
      allProducts = allProducts.concat(products)
    }

    // Process and upsert products into the local catalog
    const productsToUpsert = allProducts.map((product: any) => ({
      kinguin_id: product.kinguinId,
      product_id: product.productId,
      name: product.name,
      description: product.description,
      cover_image: product.coverImage || product.images?.cover?.url,
      screenshots: product.screenshots?.map((s: any) => s.url) || [],
      original_price: parseFloat(product.price || 0),
      sell_price: parseFloat(product.price || 0) * DEFAULT_MARGIN,
      platform: product.platform,
      genres: product.genres || [],
      release_date: product.releaseDate,
      region_id: product.regionId,
      region_name: product.region?.name || (product.regionId === 3 ? 'Worldwide' : 'Europe'),
      is_available: (product.qty || 0) > 0,
      qty: product.qty || 0,
    }))

    if (productsToUpsert.length > 0) {
      const { error } = await supabase
        .from('kinguin_products')
        .upsert(productsToUpsert, { onConflict: 'kinguin_id' })

      if (error) {
        console.error('Error upserting products:', error)
        throw error
      }
    }

    console.log(`Synced ${productsToUpsert.length} products to local DB`)

    return new Response(
      JSON.stringify({ success: true, synced: productsToUpsert.length, page, limit }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Sync error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

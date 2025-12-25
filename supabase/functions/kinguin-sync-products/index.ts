import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const KINGUIN_API_URL = 'https://gateway.kinguin.net/esa/api/v1'
const MARGIN = 1.30 // 30% margin

// Region IDs: 3 = Region Free (Worldwide), 1 = Europe
const ALLOWED_REGIONS = [3, 1]

// Shopify Admin API config
const SHOPIFY_STORE_DOMAIN = 'dingaming-js6x0.myshopify.com'
const SHOPIFY_API_VERSION = '2025-07'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const kinguinApiKey = Deno.env.get('KINGUIN_API_KEY')
    const shopifyAccessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN')
    
    if (!kinguinApiKey) {
      throw new Error('KINGUIN_API_KEY not configured')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const syncToShopify = url.searchParams.get('syncToShopify') === 'true'

    console.log(`Syncing Kinguin products - page ${page}, limit ${limit}, syncToShopify: ${syncToShopify}`)

    let allProducts: any[] = []

    // Fetch products for each allowed region
    for (const regionId of ALLOWED_REGIONS) {
      const kinguinUrl = `${KINGUIN_API_URL}/products?regionId=${regionId}&page=${page}&limit=${limit}&sortBy=updatedAt&sortType=desc`
      
      console.log(`Fetching from Kinguin for region ${regionId}:`, kinguinUrl)
      
      const response = await fetch(kinguinUrl, {
        headers: {
          'X-Api-Key': kinguinApiKey,
          'Content-Type': 'application/json'
        }
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

    // Process and insert products to local cache
    const productsToUpsert = allProducts.map((product: any) => ({
      kinguin_id: product.kinguinId,
      product_id: product.productId,
      name: product.name,
      description: product.description,
      cover_image: product.coverImage || product.images?.cover?.url,
      screenshots: product.screenshots?.map((s: any) => s.url) || [],
      original_price: parseFloat(product.price || 0),
      sell_price: parseFloat(product.price || 0) * MARGIN,
      platform: product.platform,
      genres: product.genres || [],
      release_date: product.releaseDate,
      region_id: product.regionId,
      region_name: product.region?.name || (product.regionId === 3 ? 'Worldwide' : 'Europe'),
      is_available: (product.qty || 0) > 0,
      qty: product.qty || 0
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

    // Sync to Shopify if requested and token available
    let shopifySynced = 0
    if (syncToShopify && shopifyAccessToken) {
      console.log('Syncing products to Shopify...')
      
      for (const product of productsToUpsert) {
        try {
          await syncProductToShopify(product, shopifyAccessToken)
          shopifySynced++
        } catch (err) {
          console.error(`Failed to sync product ${product.kinguin_id} to Shopify:`, err)
        }
      }
    }

    console.log(`Synced ${productsToUpsert.length} products to local DB, ${shopifySynced} to Shopify`)

    return new Response(JSON.stringify({ 
      success: true, 
      synced: productsToUpsert.length,
      shopifySynced,
      page,
      limit
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Sync error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function syncProductToShopify(product: any, accessToken: string) {
  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`
  
  // Check if product exists by searching for SKU (kinguin_id)
  const searchQuery = `
    query searchProduct($query: String!) {
      products(first: 1, query: $query) {
        edges {
          node {
            id
            title
          }
        }
      }
    }
  `
  
  const searchResult = await fetch(shopifyAdminUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({
      query: searchQuery,
      variables: { query: `sku:KINGUIN-${product.kinguin_id}` }
    })
  })

  const searchData = await searchResult.json()
  const existingProduct = searchData.data?.products?.edges?.[0]?.node

  if (existingProduct) {
    // Update existing product
    console.log(`Product ${product.kinguin_id} already exists in Shopify, updating...`)
    await updateShopifyProduct(existingProduct.id, product, accessToken)
  } else {
    // Create new product
    console.log(`Creating new Shopify product for ${product.kinguin_id}`)
    await createShopifyProduct(product, accessToken)
  }
}

async function createShopifyProduct(product: any, accessToken: string) {
  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`
  
  const mutation = `
    mutation productCreate($input: ProductInput!, $media: [CreateMediaInput!]) {
      productCreate(input: $input, media: $media) {
        product {
          id
          title
          handle
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const regionTag = product.region_id === 3 ? 'Worldwide' : 'Europe'
  
  const response = await fetch(shopifyAdminUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        input: {
          title: product.name,
          descriptionHtml: product.description || '',
          vendor: 'DinGaming',
          productType: 'Game Key',
          tags: [product.platform || 'Steam', regionTag, 'Digital'],
          status: product.is_available ? 'ACTIVE' : 'DRAFT',
          variants: [{
            price: product.sell_price.toFixed(2),
            sku: `KINGUIN-${product.kinguin_id}`,
            inventoryQuantities: {
              availableQuantity: product.qty || 0,
              locationId: 'gid://shopify/Location/1' // Default location
            },
            inventoryPolicy: 'DENY'
          }],
          metafields: [{
            namespace: 'kinguin',
            key: 'kinguin_id',
            value: product.kinguin_id.toString(),
            type: 'number_integer'
          }, {
            namespace: 'kinguin',
            key: 'original_price',
            value: product.original_price.toString(),
            type: 'number_decimal'
          }]
        },
        media: product.cover_image ? [{
          originalSource: product.cover_image,
          alt: product.name,
          mediaContentType: 'IMAGE'
        }] : []
      }
    })
  })

  const data = await response.json()
  
  if (data.data?.productCreate?.userErrors?.length > 0) {
    console.error('Shopify create error:', data.data.productCreate.userErrors)
  }
  
  return data
}

async function updateShopifyProduct(productId: string, product: any, accessToken: string) {
  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`
  
  const mutation = `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          title
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const response = await fetch(shopifyAdminUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        input: {
          id: productId,
          status: product.is_available ? 'ACTIVE' : 'DRAFT'
        }
      }
    })
  })

  return response.json()
}

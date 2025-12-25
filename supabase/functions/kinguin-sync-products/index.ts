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
          const result = await syncProductToShopify(product, shopifyAccessToken)
          if (result.success) {
            shopifySynced++
          }
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

async function syncProductToShopify(product: any, accessToken: string): Promise<{ success: boolean }> {
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
  
  if (searchData.errors) {
    console.error(`Shopify search error for ${product.kinguin_id}:`, JSON.stringify(searchData.errors))
    return { success: false }
  }
  
  const existingProduct = searchData.data?.products?.edges?.[0]?.node

  if (existingProduct) {
    // Update existing product
    console.log(`Product ${product.kinguin_id} already exists in Shopify, updating...`)
    return await updateShopifyProduct(existingProduct.id, product, accessToken)
  } else {
    // Create new product using productSet mutation (2025-07 API)
    console.log(`Creating new Shopify product for ${product.kinguin_id}`)
    return await createShopifyProduct(product, accessToken)
  }
}

async function createShopifyProduct(product: any, accessToken: string): Promise<{ success: boolean }> {
  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`
  
  // Use productSet mutation which is the correct way in 2025-07 API
  const mutation = `
    mutation productSet($input: ProductSetInput!, $synchronous: Boolean!) {
      productSet(input: $input, synchronous: $synchronous) {
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
  
  // Clean title - remove any problematic characters
  const cleanTitle = (product.name || 'Untitled Product').substring(0, 255)
  
  const response = await fetch(shopifyAdminUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        synchronous: true,
        input: {
          title: cleanTitle,
          descriptionHtml: product.description || '',
          vendor: 'DinGaming',
          productType: 'Game Key',
          tags: [product.platform || 'Steam', regionTag, 'Digital'],
          status: product.is_available ? 'ACTIVE' : 'DRAFT',
          productOptions: [{
            name: 'Title',
            values: [{ name: 'Default Title' }]
          }],
          variants: [{
            optionValues: [{ optionName: 'Title', name: 'Default Title' }],
            price: product.sell_price.toFixed(2),
            sku: `KINGUIN-${product.kinguin_id}`,
            inventoryPolicy: 'CONTINUE'
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
        }
      }
    })
  })

  const data = await response.json()
  
  // Log the full response for debugging
  if (data.errors) {
    console.error(`Shopify API error for ${product.kinguin_id}:`, JSON.stringify(data.errors))
    return { success: false }
  }
  
  if (data.data?.productSet?.userErrors?.length > 0) {
    console.error(`Shopify create userErrors for ${product.kinguin_id}:`, JSON.stringify(data.data.productSet.userErrors))
    return { success: false }
  }
  
  const createdProduct = data.data?.productSet?.product
  if (createdProduct?.id) {
    console.log(`Successfully created Shopify product: ${createdProduct.id}`)
    
    // Add image if available
    if (product.cover_image) {
      await addProductImage(createdProduct.id, product.cover_image, cleanTitle, accessToken)
    }
    
    return { success: true }
  }
  
  console.error(`Unknown Shopify response for ${product.kinguin_id}:`, JSON.stringify(data))
  return { success: false }
}

async function addProductImage(productId: string, imageUrl: string, altText: string, accessToken: string): Promise<void> {
  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`
  
  const mutation = `
    mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media {
          ... on MediaImage {
            id
          }
        }
        mediaUserErrors {
          field
          message
        }
      }
    }
  `
  
  try {
    await fetch(shopifyAdminUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          productId,
          media: [{
            originalSource: imageUrl,
            alt: altText,
            mediaContentType: 'IMAGE'
          }]
        }
      })
    })
  } catch (err) {
    console.error(`Failed to add image to product ${productId}:`, err)
  }
}

async function updateShopifyProduct(productId: string, product: any, accessToken: string): Promise<{ success: boolean }> {
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

  const data = await response.json()
  
  if (data.errors) {
    console.error(`Shopify update error for ${productId}:`, JSON.stringify(data.errors))
    return { success: false }
  }
  
  if (data.data?.productUpdate?.userErrors?.length > 0) {
    console.error(`Shopify update userErrors for ${productId}:`, JSON.stringify(data.data.productUpdate.userErrors))
    return { success: false }
  }
  
  return { success: true }
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Shopify Admin API config
const SHOPIFY_STORE_DOMAIN = 'dingaming-js6x0.myshopify.com'
const SHOPIFY_API_VERSION = '2025-07'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const shopifyAccessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN')
    
    if (!shopifyAccessToken) {
      throw new Error('SHOPIFY_ACCESS_TOKEN not configured')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const limit = parseInt(url.searchParams.get('limit') || '100')

    console.log(`Syncing DB products to Shopify - offset ${offset}, limit ${limit}`)

    // Fetch products from local DB
    const { data: products, error: fetchError } = await supabase
      .from('kinguin_products')
      .select('*')
      .order('kinguin_id', { ascending: true })
      .range(offset, offset + limit - 1)

    if (fetchError) {
      throw fetchError
    }

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        synced: 0,
        message: 'No more products to sync',
        offset,
        limit,
        done: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found ${products.length} products to sync`)

    let shopifySynced = 0
    for (const product of products) {
      try {
        const result = await syncProductToShopify(product, shopifyAccessToken)
        if (result.success) {
          shopifySynced++
        }
      } catch (err) {
        console.error(`Failed to sync product ${product.kinguin_id} to Shopify:`, err)
      }
    }

    console.log(`Synced ${shopifySynced} products to Shopify`)

    return new Response(JSON.stringify({ 
      success: true, 
      synced: shopifySynced,
      total: products.length,
      offset,
      limit,
      nextOffset: offset + limit,
      done: products.length < limit
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
  
  // Check if product exists by searching for SKU
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
    // Already exists, skip or update
    return { success: true }
  } else {
    // Create new product
    return await createShopifyProduct(product, accessToken)
  }
}

async function createShopifyProduct(product: any, accessToken: string): Promise<{ success: boolean }> {
  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`
  
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
  
  if (data.errors) {
    console.error(`Shopify API error for ${product.kinguin_id}:`, JSON.stringify(data.errors))
    return { success: false }
  }
  
  if (data.data?.productSet?.userErrors?.length > 0) {
    console.error(`Shopify userErrors for ${product.kinguin_id}:`, JSON.stringify(data.data.productSet.userErrors))
    return { success: false }
  }
  
  const createdProduct = data.data?.productSet?.product
  if (createdProduct?.id) {
    // Add image if available
    if (product.cover_image) {
      await addProductImage(createdProduct.id, product.cover_image, cleanTitle, accessToken)
    }
    return { success: true }
  }
  
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

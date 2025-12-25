import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SHOPIFY_STORE_DOMAIN = 'dingaming-js6x0.myshopify.com'
const SHOPIFY_API_VERSION = '2025-07'

// Process products in parallel batches
const CONCURRENT_LIMIT = 10

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

    console.log(`Found ${products.length} products to sync in parallel (${CONCURRENT_LIMIT} at a time)`)

    // Process in parallel batches
    let shopifySynced = 0
    let failed = 0
    
    for (let i = 0; i < products.length; i += CONCURRENT_LIMIT) {
      const batch = products.slice(i, i + CONCURRENT_LIMIT)
      
      const results = await Promise.allSettled(
        batch.map(product => createShopifyProductDirect(product, shopifyAccessToken))
      )
      
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.success) {
          shopifySynced++
        } else {
          failed++
        }
      }
      
      console.log(`Batch ${Math.floor(i / CONCURRENT_LIMIT) + 1}: ${batch.length} processed, total synced: ${shopifySynced}`)
    }

    console.log(`Finished: ${shopifySynced} synced, ${failed} failed`)

    return new Response(JSON.stringify({ 
      success: true, 
      synced: shopifySynced,
      failed,
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

// Direct create without search - uses unique handle for idempotency
async function createShopifyProductDirect(product: any, accessToken: string): Promise<{ success: boolean }> {
  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`
  
  const mutation = `
    mutation productSet($input: ProductSetInput!, $synchronous: Boolean!) {
      productSet(input: $input, synchronous: $synchronous) {
        product {
          id
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
  // Use kinguin_id in handle for idempotency - Shopify will update if exists
  const handle = `kinguin-${product.kinguin_id}`
  
  try {
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
            handle,
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
            }]
          }
        }
      })
    })

    const data = await response.json()
    
    if (data.errors) {
      console.error(`API error ${product.kinguin_id}:`, data.errors[0]?.message)
      return { success: false }
    }
    
    if (data.data?.productSet?.userErrors?.length > 0) {
      console.error(`UserError ${product.kinguin_id}:`, data.data.productSet.userErrors[0]?.message)
      return { success: false }
    }
    
    const createdProduct = data.data?.productSet?.product
    if (createdProduct?.id && product.cover_image) {
      // Fire and forget image upload - don't wait
      addProductImageAsync(createdProduct.id, product.cover_image, cleanTitle, accessToken)
    }
    
    return { success: !!createdProduct?.id }
  } catch (err) {
    console.error(`Failed ${product.kinguin_id}:`, err)
    return { success: false }
  }
}

// Async image upload - doesn't block product creation
function addProductImageAsync(productId: string, imageUrl: string, altText: string, accessToken: string): void {
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
  
  fetch(shopifyAdminUrl, {
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
  }).catch(err => console.error(`Image upload failed for ${productId}:`, err))
}

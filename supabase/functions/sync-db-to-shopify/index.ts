import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SHOPIFY_STORE_DOMAIN = 'dingaming-js6x0.myshopify.com'
const SHOPIFY_API_VERSION = '2025-07'

// Shopify rate limit: ~2 requests/second for mutations
const DELAY_BETWEEN_PRODUCTS_MS = 600

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
    const limit = parseInt(url.searchParams.get('limit') || '20') // Smaller batches to avoid timeout

    console.log(`Syncing DB products to Shopify - offset ${offset}, limit ${limit}`)

    // Get settings
    const { data: settingsData } = await supabase
      .from('store_settings')
      .select('key, value')
      .in('key', ['global_margin_percent', 'eur_to_dkk_rate'])

    let globalMargin = 30
    let eurToDkkRate = 7.46

    if (settingsData) {
      for (const s of settingsData) {
        if (s.key === 'global_margin_percent') globalMargin = Number(s.value) || 30
        if (s.key === 'eur_to_dkk_rate') eurToDkkRate = Number(s.value) || 7.46
      }
    }

    // Fetch products from local DB that are NOT yet on Shopify
    const { data: products, error: fetchError } = await supabase
      .from('kinguin_products')
      .select('*')
      .eq('is_available', true)
      .is('shopify_product_id', null)  // Only products not yet synced
      .order('kinguin_id', { ascending: true })
      .limit(limit)

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

    console.log(`Found ${products.length} products to sync sequentially`)

    let shopifySynced = 0
    let failed = 0

    // Process sequentially with delay to respect rate limits
    for (const product of products) {
      try {
        const result = await createOrUpdateShopifyProduct(product, shopifyAccessToken, globalMargin, eurToDkkRate, supabase)
        if (result.success) {
          shopifySynced++
        } else {
          failed++
        }
        
        // Delay between requests to avoid throttling
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_PRODUCTS_MS))
      } catch (err) {
        console.error(`Failed to sync product ${product.kinguin_id}:`, err)
        failed++
      }
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

async function createOrUpdateShopifyProduct(
  product: any, 
  accessToken: string, 
  globalMargin: number,
  eurToDkkRate: number,
  supabase: any
): Promise<{ success: boolean; shopifyId?: string }> {
  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`
  
  // Calculate final price in DKK
  const margin = product.margin_percent ?? globalMargin
  const priceWithMargin = product.sell_price * (1 + margin / 100)
  const priceInDkk = priceWithMargin * eurToDkkRate

  const regionTag = product.region_id === 3 ? 'Worldwide' : 'Europe'
  const cleanTitle = (product.name || 'Untitled Product').substring(0, 255)
  const handle = `kinguin-${product.kinguin_id}`
  
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
            tags: [product.platform || 'Steam', regionTag, 'Digital', 'DKK'],
            status: product.is_available ? 'ACTIVE' : 'DRAFT',
            productOptions: [{
              name: 'Title',
              values: [{ name: 'Default Title' }]
            }],
            variants: [{
              optionValues: [{ optionName: 'Title', name: 'Default Title' }],
              price: priceInDkk.toFixed(2),
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
              key: 'original_price_eur',
              value: product.sell_price.toString(),
              type: 'number_decimal'
            }, {
              namespace: 'kinguin',
              key: 'margin_percent',
              value: margin.toString(),
              type: 'number_decimal'
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
    if (createdProduct?.id) {
      // Update local DB with Shopify product ID
      await supabase
        .from('kinguin_products')
        .update({ 
          shopify_product_id: createdProduct.id,
          last_synced_to_shopify: new Date().toISOString()
        })
        .eq('kinguin_id', product.kinguin_id)

      // Add image (fire and forget)
      if (product.cover_image) {
        addProductImageAsync(createdProduct.id, product.cover_image, cleanTitle, accessToken)
      }
      
      return { success: true, shopifyId: createdProduct.id }
    }
    
    return { success: false }
  } catch (err) {
    console.error(`Failed ${product.kinguin_id}:`, err)
    return { success: false }
  }
}

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

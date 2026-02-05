import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-event-secret, x-webhook-secret, x-secret',
}

const SHOPIFY_STORE_DOMAIN = 'dingaming-js6x0.myshopify.com'
const SHOPIFY_API_VERSION = '2025-07'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const expectedSecret = Deno.env.get('KINGUIN_WEBHOOK_SECRET')
    
    // Check multiple possible header names for the secret
    const eventSecret = req.headers.get('x-event-secret') 
      || req.headers.get('x-webhook-secret')
      || req.headers.get('x-secret')
      || req.headers.get('secret')
    
    // Log headers for debugging (first few chars only)
    console.log('Webhook headers received:', Array.from(req.headers.keys()).join(', '))
    console.log('Secret match:', eventSecret ? `received (${eventSecret.substring(0,4)}...)` : 'not found', 'expected:', expectedSecret ? `${expectedSecret.substring(0,4)}...` : 'not set')
    
    if (!eventSecret || eventSecret !== expectedSecret) {
      console.error('Invalid webhook secret')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const payload = await req.json()
    console.log('Webhook received:', JSON.stringify(payload).substring(0, 500))

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    const shopifyAccessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN')

    const eventType = payload.event || payload.type || 'unknown'
    
    await supabase.from('kinguin_webhook_logs').insert({
      event_type: eventType,
      payload: payload
    })

    if (eventType === 'product.update' || payload.kinguinId) {
      await handleProductUpdate(supabase, payload, shopifyAccessToken)
    } else if (eventType === 'order.status' || payload.orderId) {
      await handleOrderStatusChange(supabase, payload)
    }

    return new Response(null, { 
      status: 204,
      headers: corsHeaders
    })
  } catch (error) {
    console.error('Webhook error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function handleProductUpdate(supabase: any, payload: any, shopifyAccessToken: string | undefined) {
  const kinguinId = payload.kinguinId
  console.log('Processing product update:', kinguinId)
  
  // Check if product exists first
  const { data: existingProduct } = await supabase
    .from('kinguin_products')
    .select('*')
    .eq('kinguin_id', kinguinId)
    .maybeSingle()

  // If product doesn't exist, skip - we only update existing products via webhook
  // New products should be synced via the full sync endpoint
  if (!existingProduct) {
    console.log('Product not found in DB, skipping update:', kinguinId)
    return
  }

  // Get settings for price calculation
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

  const price = payload.price ? parseFloat(payload.price) : existingProduct.original_price
  const qty = payload.qty ?? existingProduct.qty
  const isAvailable = qty > 0

  // Only update the fields that come from the webhook
  const updateData: Record<string, any> = {
    original_price: price,
    sell_price: price,
    qty: qty,
    is_available: isAvailable,
    updated_at: new Date().toISOString()
  }

  // Add product_id if provided
  if (payload.productId) {
    updateData.product_id = payload.productId
  }

  const { error } = await supabase
    .from('kinguin_products')
    .update(updateData)
    .eq('kinguin_id', kinguinId)

  if (error) {
    console.error('Error updating product:', error)
    throw error
  }

  console.log('Product updated in DB:', kinguinId, '- price:', price, 'qty:', qty)

  // Sync to Shopify if product is linked
  if (existingProduct.shopify_product_id && shopifyAccessToken) {
    const margin = existingProduct.margin_percent ?? globalMargin
    const priceWithMargin = price * (1 + margin / 100)
    const priceInDkk = priceWithMargin * eurToDkkRate

    await updateShopifyProduct(
      existingProduct.shopify_product_id,
      priceInDkk,
      isAvailable,
      shopifyAccessToken
    )
  }
}

async function handleOrderStatusChange(supabase: any, payload: any) {
  console.log('Processing order status change:', payload.orderId)
  
  const orderData: any = {
    status: payload.status,
    updated_at: new Date().toISOString()
  }

  if (payload.status === 'completed' && payload.products) {
    const keys = payload.products.flatMap((p: any) => 
      p.keys?.map((k: any) => ({
        productName: p.name,
        key: k.serial || k.value,
        type: k.type || 'text'
      })) || []
    )
    orderData.keys = keys
  }

  const { error } = await supabase
    .from('kinguin_orders')
    .update(orderData)
    .eq('order_id', payload.orderId)

  if (error) {
    console.error('Error updating order:', error)
    throw error
  }

  console.log('Order status updated:', payload.orderId, 'to', payload.status)
}

async function updateShopifyProduct(shopifyProductId: string, priceInDkk: number, isAvailable: boolean, accessToken: string) {
  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`

  // First get the variant ID
  const getVariantQuery = `
    query getProduct($id: ID!) {
      product(id: $id) {
        variants(first: 1) {
          edges {
            node {
              id
            }
          }
        }
      }
    }
  `

  try {
    const variantRes = await fetch(shopifyAdminUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: getVariantQuery,
        variables: { id: shopifyProductId }
      })
    })

    const variantData = await variantRes.json()
    const variantId = variantData.data?.product?.variants?.edges?.[0]?.node?.id

    if (!variantId) {
      console.error('Could not find variant for product:', shopifyProductId)
      return
    }

    // Update variant price and product status
    const mutation = `
      mutation productVariantUpdate($input: ProductVariantInput!) {
        productVariantUpdate(input: $input) {
          productVariant {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `

    await fetch(shopifyAdminUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            id: variantId,
            price: priceInDkk.toFixed(2)
          }
        }
      })
    })

    // Update product status
    const statusMutation = `
      mutation productUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
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

    await fetch(shopifyAdminUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: statusMutation,
        variables: {
          input: {
            id: shopifyProductId,
            status: isAvailable ? 'ACTIVE' : 'DRAFT'
          }
        }
      })
    })

    console.log(`Updated Shopify product ${shopifyProductId} - price: ${priceInDkk.toFixed(2)} DKK, status: ${isAvailable ? 'ACTIVE' : 'DRAFT'}`)
  } catch (err) {
    console.error('Failed to update Shopify product:', err)
  }
}

async function setShopifyProductDraft(shopifyProductId: string, accessToken: string) {
  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`

  const mutation = `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
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
    await fetch(shopifyAdminUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            id: shopifyProductId,
            status: 'DRAFT'
          }
        }
      })
    })
    console.log(`Set Shopify product ${shopifyProductId} to DRAFT`)
  } catch (err) {
    console.error('Failed to set Shopify product to DRAFT:', err)
  }
}

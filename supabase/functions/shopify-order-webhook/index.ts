import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-shop-domain, x-shopify-topic',
}

const KINGUIN_API_URL = 'https://gateway.kinguin.net/esa/api/v1'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const kinguinApiKey = Deno.env.get('KINGUIN_API_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const topic = req.headers.get('x-shopify-topic')
    const payload = await req.json()
    
    console.log('Shopify webhook received:', topic)
    console.log('Payload:', JSON.stringify(payload))

    // Log the webhook
    await supabase.from('kinguin_webhook_logs').insert({
      event_type: `shopify_${topic}`,
      payload: payload
    })

    // Handle order paid webhook
    if (topic === 'orders/paid' || topic === 'orders/create') {
      await handleOrderPaid(supabase, payload, kinguinApiKey)
    }

    return new Response(null, { 
      status: 200,
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

async function handleOrderPaid(supabase: any, order: any, kinguinApiKey: string) {
  console.log('Processing paid order:', order.id)
  
  // Extract Kinguin product IDs from line items
  const kinguinProducts: Array<{ kinguinId: number; qty: number; price: number }> = []
  
  for (const item of order.line_items || []) {
    // Check if this is a Kinguin product by SKU pattern
    const sku = item.sku || ''
    if (sku.startsWith('KINGUIN-')) {
      const kinguinId = parseInt(sku.replace('KINGUIN-', ''))
      
      // Get original price from our database
      const { data: product } = await supabase
        .from('kinguin_products')
        .select('original_price')
        .eq('kinguin_id', kinguinId)
        .single()
      
      if (product) {
        kinguinProducts.push({
          kinguinId,
          qty: item.quantity,
          price: product.original_price
        })
      }
    }
  }

  if (kinguinProducts.length === 0) {
    console.log('No Kinguin products in order')
    return
  }

  console.log('Placing Kinguin order for products:', kinguinProducts)

  // Place order with Kinguin
  const kinguinOrderPayload = {
    products: kinguinProducts.map(p => ({
      kinguinId: p.kinguinId,
      qty: p.qty,
      price: p.price
    })),
    orderExternalId: `shopify_${order.id}`
  }

  const kinguinResponse = await fetch(`${KINGUIN_API_URL}/order`, {
    method: 'POST',
    headers: {
      'X-Api-Key': kinguinApiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(kinguinOrderPayload)
  })

  if (!kinguinResponse.ok) {
    const errorText = await kinguinResponse.text()
    console.error('Kinguin order failed:', kinguinResponse.status, errorText)
    throw new Error(`Kinguin order failed: ${errorText}`)
  }

  const kinguinOrder = await kinguinResponse.json()
  console.log('Kinguin order placed:', kinguinOrder.orderId)

  // Store order in our database
  await supabase.from('kinguin_orders').insert({
    order_id: kinguinOrder.orderId,
    order_external_id: `shopify_${order.id}`,
    status: kinguinOrder.status || 'processing',
    total_price: order.total_price,
    user_email: order.email,
    products: kinguinProducts
  })

  console.log('Order saved to database')
}

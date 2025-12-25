import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-event-secret',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify webhook secret
    const eventSecret = req.headers.get('x-event-secret')
    const expectedSecret = Deno.env.get('KINGUIN_WEBHOOK_SECRET')
    
    if (!eventSecret || eventSecret !== expectedSecret) {
      console.error('Invalid webhook secret')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const payload = await req.json()
    console.log('Webhook received:', JSON.stringify(payload))

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Determine event type from payload
    const eventType = payload.event || payload.type || 'unknown'
    
    // Log the webhook
    await supabase.from('kinguin_webhook_logs').insert({
      event_type: eventType,
      payload: payload
    })

    // Handle different event types
    if (eventType === 'product.update' || payload.kinguinId) {
      // Product update webhook
      await handleProductUpdate(supabase, payload)
    } else if (eventType === 'order.status' || payload.orderId) {
      // Order status change webhook
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

async function handleProductUpdate(supabase: any, payload: any) {
  console.log('Processing product update:', payload.kinguinId)
  
  const MARGIN = 1.30 // 30% margin

  // Check if product matches our region criteria (Europe = various IDs, Region Free = 3)
  const allowedRegions = [3] // Region free, add EU region IDs as needed
  const regionId = payload.regionId || payload.region?.id
  
  if (regionId && !allowedRegions.includes(regionId)) {
    console.log(`Skipping product ${payload.kinguinId} - region ${regionId} not allowed`)
    return
  }

  const sellPrice = payload.price ? parseFloat(payload.price) * MARGIN : null
  
  const productData = {
    kinguin_id: payload.kinguinId,
    product_id: payload.productId,
    name: payload.name,
    original_price: payload.price ? parseFloat(payload.price) : 0,
    sell_price: sellPrice || 0,
    qty: payload.qty || 0,
    is_available: (payload.qty || 0) > 0
  }

  const { error } = await supabase
    .from('kinguin_products')
    .upsert(productData, { onConflict: 'kinguin_id' })

  if (error) {
    console.error('Error updating product:', error)
    throw error
  }

  console.log('Product updated successfully:', payload.kinguinId)
}

async function handleOrderStatusChange(supabase: any, payload: any) {
  console.log('Processing order status change:', payload.orderId)
  
  const orderData: any = {
    status: payload.status,
    updated_at: new Date().toISOString()
  }

  // If order is completed, store the keys
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

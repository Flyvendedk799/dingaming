import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-event-secret, x-webhook-secret, x-secret',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const expectedSecret = Deno.env.get('KINGUIN_WEBHOOK_SECRET')

    // Check multiple possible header names for the secret
    const eventSecret =
      req.headers.get('x-event-secret') ||
      req.headers.get('x-webhook-secret') ||
      req.headers.get('x-secret') ||
      req.headers.get('secret')

    if (!eventSecret || eventSecret !== expectedSecret) {
      console.error('Invalid webhook secret')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = await req.json()
    console.log('Webhook received:', JSON.stringify(payload).substring(0, 500))

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const eventType = payload.event || payload.type || 'unknown'

    await supabase.from('kinguin_webhook_logs').insert({
      event_type: eventType,
      payload: payload,
    })

    if (eventType === 'product.update' || payload.kinguinId) {
      await handleProductUpdate(supabase, payload)
    } else if (eventType === 'order.status' || payload.orderId) {
      await handleOrderStatusChange(supabase, payload)
    }

    return new Response(null, { status: 204, headers: corsHeaders })
  } catch (error) {
    console.error('Webhook error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function handleProductUpdate(supabase: any, payload: any) {
  const kinguinId = payload.kinguinId
  console.log('Processing product update:', kinguinId)

  // We only update products already in our catalog. New products arrive via sync.
  const { data: existingProduct } = await supabase
    .from('kinguin_products')
    .select('id, original_price, qty')
    .eq('kinguin_id', kinguinId)
    .maybeSingle()

  if (!existingProduct) {
    console.log('Product not found in DB, skipping update:', kinguinId)
    return
  }

  const price = payload.price ? parseFloat(payload.price) : existingProduct.original_price
  const qty = payload.qty ?? existingProduct.qty
  const isAvailable = qty > 0

  const updateData: Record<string, any> = {
    original_price: price,
    sell_price: price,
    qty: qty,
    is_available: isAvailable,
    updated_at: new Date().toISOString(),
  }

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
}

async function handleOrderStatusChange(supabase: any, payload: any) {
  console.log('Processing order status change:', payload.orderId)

  const orderData: any = {
    status: payload.status,
    updated_at: new Date().toISOString(),
  }

  if (payload.status === 'completed' && payload.products) {
    const keys = payload.products.flatMap((p: any) =>
      p.keys?.map((k: any) => ({
        productName: p.name,
        key: k.serial || k.value,
        type: k.type || 'text',
      })) || [],
    )
    orderData.keys = keys
  }

  // Update both the legacy kinguin_orders record and the native order, if present.
  await supabase.from('kinguin_orders').update(orderData).eq('order_id', payload.orderId)

  if (payload.status === 'completed' && payload.products) {
    const keys = payload.products.flatMap((p: any) =>
      p.keys?.map((k: any) => ({ productName: p.name, key: k.serial || k.value, type: k.type || 'text' })) || [],
    )
    await supabase
      .from('orders')
      .update({ status: 'completed', keys, updated_at: new Date().toISOString() })
      .eq('kinguin_order_id', payload.orderId)
  }

  console.log('Order status updated:', payload.orderId, 'to', payload.status)
}

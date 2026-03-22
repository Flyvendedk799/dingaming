import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-shop-domain, x-shopify-topic',
}

const KINGUIN_API_URL = 'https://gateway.kinguin.net/esa/api/v1'

async function verifyHmac(rawBody: string, hmacHeader: string | null): Promise<boolean> {
  if (!hmacHeader) return false
  const secret = Deno.env.get('SHOPIFY_WEBHOOK_SECRET')
  if (!secret) {
    console.error('SHOPIFY_WEBHOOK_SECRET not set')
    return false
  }

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
  const computed = btoa(String.fromCharCode(...new Uint8Array(signature)))
  return computed === hmacHeader
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Read raw body for HMAC verification
    const rawBody = await req.text()

    // HMAC validation
    const hmacHeader = req.headers.get('x-shopify-hmac-sha256')
    const isValid = await verifyHmac(rawBody, hmacHeader)
    if (!isValid) {
      console.error('HMAC validation failed')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const payload = JSON.parse(rawBody)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const kinguinApiKey = Deno.env.get('KINGUIN_API_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const topic = req.headers.get('x-shopify-topic')
    
    console.log('Shopify webhook received:', topic)

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

  // === Idempotency check ===
  const externalId = `shopify_${order.id}`
  const { data: existingOrder } = await supabase
    .from('kinguin_orders')
    .select('id')
    .eq('order_external_id', externalId)
    .maybeSingle()

  if (existingOrder) {
    console.log('Order already processed (idempotency):', externalId)
    return
  }
  
  // First, check if this is a Shard bundle purchase
  const shardsPurchased = await handleShardBundlePurchase(supabase, order)
  
  // Award shards to customer for regular purchases (not shard bundle purchases)
  if (!shardsPurchased) {
    await awardPurchaseShards(supabase, order)
  }

  // === Resolve user_id from email ===
  let userId: string | null = null
  const email = order.email
  if (email) {
    const { data: users } = await supabase.auth.admin.listUsers()
    const user = users?.users?.find((u: any) => u.email === email)
    if (user) userId = user.id
  }
  
  // Extract Kinguin product IDs from line items
  const kinguinProducts: Array<{ kinguinId: number; qty: number; price: number; name: string }> = []
  
  for (const item of order.line_items || []) {
    // Skip shard bundle products
    const sku = item.sku || ''
    if (sku.startsWith('SHARDS-')) {
      continue
    }
    
    // Check if this is a Kinguin product by SKU pattern
    if (sku.startsWith('KINGUIN-')) {
      const kinguinId = parseInt(sku.replace('KINGUIN-', ''))
      
      // Get original price AND name from our database
      const { data: product } = await supabase
        .from('kinguin_products')
        .select('original_price, name')
        .eq('kinguin_id', kinguinId)
        .single()
      
      if (product) {
        kinguinProducts.push({
          kinguinId,
          qty: item.quantity,
          price: product.original_price,
          name: product.name
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
    orderExternalId: externalId
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

  // Store order in our database (now with product names)
  await supabase.from('kinguin_orders').insert({
    order_id: kinguinOrder.orderId,
    order_external_id: externalId,
    status: kinguinOrder.status || 'processing',
    total_price: order.total_price,
    user_email: email,
    user_id: userId,
    products: kinguinProducts
  })

  console.log('Order saved to database')
}

// Handle Shard bundle purchases - award shards directly
async function handleShardBundlePurchase(supabase: any, order: any): Promise<boolean> {
  let totalShardsToAward = 0
  let hasShardPurchase = false

  // Shard bundle definitions (must match frontend)
  const SHARD_BUNDLES: Record<string, number> = {
    'SHARDS-5000': 5100,
    'SHARDS-10000': 10400,
    'SHARDS-25000': 26500,
    'SHARDS-50000': 54000,
  }

  for (const item of order.line_items || []) {
    const sku = item.sku || ''
    if (sku.startsWith('SHARDS-') && SHARD_BUNDLES[sku]) {
      hasShardPurchase = true
      totalShardsToAward += SHARD_BUNDLES[sku] * (item.quantity || 1)
      console.log(`Shard bundle found: ${sku} x ${item.quantity} = ${SHARD_BUNDLES[sku] * (item.quantity || 1)} shards`)
    }
  }

  if (!hasShardPurchase || totalShardsToAward <= 0) {
    return false
  }

  const email = order.email
  if (!email) {
    console.log('No email in order, cannot award shard bundle')
    return true
  }

  const { data: users } = await supabase.auth.admin.listUsers()
  const user = users?.users?.find((u: any) => u.email === email)
  
  if (!user) {
    console.log('User not found for shard bundle purchase:', email)
    return true
  }

  const { data: existingTx } = await supabase
    .from('shard_transactions')
    .select('id')
    .eq('reference_id', `shopify_shards_${order.id}`)
    .maybeSingle()

  if (existingTx) {
    console.log('Shard bundle already processed for order:', order.id)
    return true
  }

  const { error } = await supabase
    .from('shard_transactions')
    .insert({
      user_id: user.id,
      amount: totalShardsToAward,
      type: 'purchase_shards',
      description: `Køb: ${totalShardsToAward.toLocaleString()} Shards pakke`,
      reference_id: `shopify_shards_${order.id}`,
    })

  if (error) {
    console.error('Failed to award shard bundle:', error)
    return true
  }

  console.log(`Awarded ${totalShardsToAward} shards to user ${user.id} for shard bundle purchase`)
  return true
}

// Award shards to customer based on purchase amount
async function awardPurchaseShards(supabase: any, order: any) {
  const email = order.email
  if (!email) {
    console.log('No email in order, cannot award shards')
    return
  }

  const { data: users } = await supabase.auth.admin.listUsers()
  const user = users?.users?.find((u: any) => u.email === email)
  
  if (!user) {
    console.log('User not found for email:', email)
    return
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    console.log('User has no profile, not a club member')
    return
  }

  const { data: rule } = await supabase
    .from('shard_earning_rules')
    .select('percentage')
    .eq('action_type', 'purchase')
    .eq('is_active', true)
    .maybeSingle()

  const percentage = rule?.percentage || 1.0
  const orderTotal = parseFloat(order.total_price) || 0
  const shardsToAward = Math.floor(orderTotal * (percentage / 100) * 1000)

  if (shardsToAward <= 0) {
    console.log('No shards to award for order total:', orderTotal)
    return
  }

  const { error } = await supabase
    .from('shard_transactions')
    .insert({
      user_id: user.id,
      amount: shardsToAward,
      type: 'purchase',
      description: `Køb: Ordre #${order.order_number || order.id}`,
      reference_id: `shopify_${order.id}`,
    })

  if (error) {
    console.error('Failed to award shards:', error)
    return
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('total_purchases')
    .eq('id', user.id)
    .single()

  if (currentProfile) {
    await supabase
      .from('profiles')
      .update({ 
        total_purchases: (parseFloat(currentProfile.total_purchases) || 0) + orderTotal 
      })
      .eq('id', user.id)
  }

  console.log(`Awarded ${shardsToAward} shards to user ${user.id} for order ${order.id}`)
}

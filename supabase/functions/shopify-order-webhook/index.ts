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
  
  // First, check if this is a Shard bundle purchase
  const shardsPurchased = await handleShardBundlePurchase(supabase, order)
  
  // Award shards to customer for regular purchases (not shard bundle purchases)
  if (!shardsPurchased) {
    await awardPurchaseShards(supabase, order)
  }
  
  // Extract Kinguin product IDs from line items
  const kinguinProducts: Array<{ kinguinId: number; qty: number; price: number }> = []
  
  for (const item of order.line_items || []) {
    // Skip shard bundle products
    const sku = item.sku || ''
    if (sku.startsWith('SHARDS-')) {
      continue
    }
    
    // Check if this is a Kinguin product by SKU pattern
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

// Handle Shard bundle purchases - award shards directly
async function handleShardBundlePurchase(supabase: any, order: any): Promise<boolean> {
  let totalShardsToAward = 0
  let hasShardPurchase = false

  // Shard bundle definitions (must match frontend)
  const SHARD_BUNDLES: Record<string, number> = {
    'SHARDS-5000': 5100,   // 5000 + 2% bonus
    'SHARDS-10000': 10400, // 10000 + 4% bonus
    'SHARDS-25000': 26500, // 25000 + 6% bonus
    'SHARDS-50000': 54000, // 50000 + 8% bonus
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
    return true // Still mark as shard purchase to prevent double-awarding
  }

  // Look up user by email
  const { data: users } = await supabase.auth.admin.listUsers()
  const user = users?.users?.find((u: any) => u.email === email)
  
  if (!user) {
    console.log('User not found for shard bundle purchase:', email)
    return true
  }

  // Check if this order was already processed (idempotency)
  const { data: existingTx } = await supabase
    .from('shard_transactions')
    .select('id')
    .eq('reference_id', `shopify_shards_${order.id}`)
    .maybeSingle()

  if (existingTx) {
    console.log('Shard bundle already processed for order:', order.id)
    return true
  }

  // Award shards
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

  // Look up user by email
  const { data: users } = await supabase.auth.admin.listUsers()
  const user = users?.users?.find((u: any) => u.email === email)
  
  if (!user) {
    console.log('User not found for email:', email)
    return
  }

  // Check if profile exists (user is in Customer Club)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    console.log('User has no profile, not a club member')
    return
  }

  // Get earning rule for purchases
  const { data: rule } = await supabase
    .from('shard_earning_rules')
    .select('percentage')
    .eq('action_type', 'purchase')
    .eq('is_active', true)
    .maybeSingle()

  const percentage = rule?.percentage || 1.0 // Default 1%
  const orderTotal = parseFloat(order.total_price) || 0
  
  // Calculate shards: orderTotal * percentage% * 1000 (since 1000 shards = 1 DKK)
  const shardsToAward = Math.floor(orderTotal * (percentage / 100) * 1000)

  if (shardsToAward <= 0) {
    console.log('No shards to award for order total:', orderTotal)
    return
  }

  // Insert shard transaction (trigger will update balance)
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

  // Update total purchases on profile
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

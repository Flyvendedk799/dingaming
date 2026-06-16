// Order fulfillment: runs after an order is paid.
//
// 1. Places the order with Kinguin (if KINGUIN_API_KEY is configured) to obtain
//    real game keys. Without a key (e.g. local dev) it simulates demo keys so
//    the end-to-end flow is fully testable.
// 2. Writes the keys back onto the order + order_items.
// 3. Awards loyalty shards to the buyer (1% of order total) when logged in.
// 4. Burns any single-use discount code that was applied.

const KINGUIN_API_URL = 'https://gateway.kinguin.net/esa/api/v1'
const SHARD_EARN_RATE = 0.01 // 1% of order total (DKK), 1 DKK ~= 1 shard

interface OrderRow {
  id: string
  user_id: string | null
  email: string
  total: number
  discount_code: string | null
  status: string
}

interface OrderItemRow {
  id: string
  kinguin_id: number
  name: string
  quantity: number
}

export async function fulfillOrder(supabase: any, orderId: string): Promise<{ ok: boolean; error?: string }> {
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id, user_id, email, total, discount_code, status')
    .eq('id', orderId)
    .maybeSingle()

  if (orderErr || !order) {
    return { ok: false, error: 'Order not found' }
  }

  const typedOrder = order as OrderRow

  // Idempotency: never fulfill twice.
  if (typedOrder.status === 'completed' || typedOrder.status === 'fulfilling') {
    return { ok: true }
  }

  await supabase.from('orders').update({ status: 'fulfilling' }).eq('id', orderId)

  const { data: items } = await supabase
    .from('order_items')
    .select('id, kinguin_id, name, quantity')
    .eq('order_id', orderId)

  const orderItems = (items || []) as OrderItemRow[]
  const kinguinApiKey = Deno.env.get('KINGUIN_API_KEY')

  let kinguinOrderId: string | null = null
  const keys: Array<{ productName: string; key: string; kinguinId: number }> = []

  try {
    if (kinguinApiKey) {
      // Real fulfillment via Kinguin.
      const orderPayload = {
        products: orderItems.map((it) => ({ kinguinId: it.kinguin_id, qty: it.quantity })),
        orderExternalId: typedOrder.id,
      }

      const res = await fetch(`${KINGUIN_API_URL}/order`, {
        method: 'POST',
        headers: { 'X-Api-Key': kinguinApiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Kinguin API error: ${res.status} - ${txt}`)
      }

      const data = await res.json()
      kinguinOrderId = data.orderId ?? null

      // Keys may arrive asynchronously via kinguin-webhook; capture any that are
      // already present in the response.
      for (const p of data.products || []) {
        for (const k of p.keys || []) {
          keys.push({ productName: p.name, key: k.serial || k.value, kinguinId: p.kinguinId })
        }
      }

      // Mirror into the legacy kinguin_orders table for the admin order views.
      await supabase.from('kinguin_orders').insert({
        order_id: kinguinOrderId,
        order_external_id: typedOrder.id,
        status: data.status || 'processing',
        total_price: typedOrder.total,
        user_email: typedOrder.email,
        user_id: typedOrder.user_id,
        products: data.products || orderItems,
      })
    } else {
      // Dev / no-API-key mode: simulate instant digital delivery.
      for (const it of orderItems) {
        for (let i = 0; i < it.quantity; i++) {
          keys.push({ productName: it.name, key: simulateKey(), kinguinId: it.kinguin_id })
        }
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Fulfillment failed'
    await supabase
      .from('orders')
      .update({ status: 'failed', error_message: msg })
      .eq('id', orderId)
    return { ok: false, error: msg }
  }

  // Attach one key per order item line (best effort) for quick display.
  for (const it of orderItems) {
    const match = keys.find((k) => k.kinguinId === it.kinguin_id)
    if (match) {
      await supabase.from('order_items').update({ game_key: match.key }).eq('id', it.id)
    }
  }

  // Award loyalty shards to logged-in buyers.
  let shardsAwarded = 0
  if (typedOrder.user_id) {
    shardsAwarded = Math.max(0, Math.round(Number(typedOrder.total) * SHARD_EARN_RATE))
    if (shardsAwarded > 0) {
      await supabase.from('shard_transactions').insert({
        user_id: typedOrder.user_id,
        amount: shardsAwarded,
        type: 'purchase',
        description: `Køb belønning (ordre ${typedOrder.id.slice(0, 8)})`,
        reference_id: typedOrder.id,
      })
    }
    // Track lifetime purchases for loyalty tiers (race-free via SQL function).
    const { error: incErr } = await supabase.rpc('increment_total_purchases', {
      _user_id: typedOrder.user_id,
      _amount: Number(typedOrder.total),
    })
    if (incErr) console.error('increment_total_purchases failed:', incErr)
  }

  // Burn a single-use discount code.
  if (typedOrder.discount_code) {
    const { data: dc } = await supabase
      .from('discount_codes')
      .select('id, used_count')
      .ilike('code', typedOrder.discount_code)
      .maybeSingle()
    if (dc) {
      await supabase
        .from('discount_codes')
        .update({ used_count: (dc.used_count || 0) + 1 })
        .eq('id', dc.id)
    }
    await supabase
      .from('user_rewards')
      .update({ status: 'used', used_at: new Date().toISOString() })
      .eq('voucher_code', typedOrder.discount_code)
  }

  // A real Kinguin order may still be "processing" until keys are delivered.
  const finalStatus = kinguinApiKey && keys.length === 0 ? 'fulfilling' : 'completed'

  await supabase
    .from('orders')
    .update({
      status: finalStatus,
      kinguin_order_id: kinguinOrderId,
      keys,
      shards_awarded: shardsAwarded,
      error_message: null,
    })
    .eq('id', orderId)

  return { ok: true }
}

function simulateKey(): string {
  const seg = () =>
    Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')
  return `${seg()}-${seg()}-${seg()}`
}

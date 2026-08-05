import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-event-name, x-event-secret, x-webhook-secret, x-secret',
}

const KINGUIN_API_V2 = 'https://gateway.kinguin.net/esa/api/v2'

/**
 * Kinguin webhook receiver.
 *
 * The merchant dashboard configures each event separately, with its own URL
 * and secret, and offers `order.complete` as well as `order.status` and
 * `product.update` — the public API docs only list the latter two, so trust
 * the dashboard.
 *
 * Because the exact envelope differs between those events, the event name is
 * resolved from three places in order of reliability:
 *   1. an `?event=` query parameter, which you control when pasting the URL
 *      into the dashboard and which therefore always works
 *   2. the `X-Event-Name` header
 *   3. the body, or an inference from which ids it contains
 *
 * Two things about the real format broke the previous version:
 *
 * 1. The event name is not in the body. The old code read `payload.event`, so
 *    every event logged as "unknown" and routing fell through to guessing.
 *
 * 2. The documented order payload is only
 *    { orderId, orderExternalId, status, updatedAt } — no keys. The old code
 *    gated completion on `payload.status === 'completed' && payload.products`,
 *    and since `products` is never present, a paid order was never marked
 *    complete and the customer never received the key. Keys are fetched in a
 *    second call, and `order.complete` counts as delivery whether or not it
 *    carries a status field.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const expectedSecret = Deno.env.get('KINGUIN_WEBHOOK_SECRET')

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

    // ?event= wins: it is the one signal we set ourselves when configuring the
    // webhook, so it cannot be wrong about which dashboard entry fired.
    const eventName =
      new URL(req.url).searchParams.get('event') ||
      req.headers.get('x-event-name') ||
      payload.event ||
      payload.type ||
      (payload.orderId ? 'order.status' : payload.kinguinId ? 'product.update' : 'unknown')

    console.log('Webhook:', eventName, JSON.stringify(payload).slice(0, 300))

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    await supabase.from('kinguin_webhook_logs').insert({
      event_type: eventName,
      payload,
    })

    if (eventName === 'product.update' || (eventName === 'unknown' && payload.kinguinId)) {
      await handleProductUpdate(supabase, payload)
    } else if (eventName.startsWith('order.') || payload.orderId) {
      await handleOrderStatusChange(supabase, payload, eventName)
    }

    // Kinguin expects a 2xx with an empty body; it recommends 204.
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

  // Only products already in our catalogue; new ones arrive via the sync.
  const { data: existingProduct } = await supabase
    .from('kinguin_products')
    .select('id, original_price, qty')
    .eq('kinguin_id', kinguinId)
    .maybeSingle()

  if (!existingProduct) return

  const price = payload.price ? parseFloat(payload.price) : existingProduct.original_price
  const qty = payload.qty ?? existingProduct.qty

  const updateData: Record<string, any> = {
    original_price: price,
    sell_price: price,
    qty,
    is_available: qty > 0,
    updated_at: new Date().toISOString(),
  }
  if (payload.productId) updateData.product_id = payload.productId

  const { error } = await supabase
    .from('kinguin_products')
    .update(updateData)
    .eq('kinguin_id', kinguinId)

  if (error) {
    console.error('Error updating product:', error)
    throw error
  }
}

/** The order payload has no keys, so completion means going and getting them. */
async function fetchKeys(orderId: string): Promise<Array<{ productName: string; key: string; type: string }>> {
  const apiKey = Deno.env.get('KINGUIN_API_KEY')
  if (!apiKey) {
    console.error('KINGUIN_API_KEY not configured — cannot retrieve keys')
    return []
  }

  const res = await fetch(`${KINGUIN_API_V2}/order/${orderId}/keys`, {
    headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    console.error(`Key retrieval failed for ${orderId}: ${res.status} ${await res.text()}`)
    return []
  }

  const data = await res.json()
  const rows = Array.isArray(data) ? data : data.results || data.keys || []

  return rows
    .map((k: any) => ({
      productName: k.name ?? k.productName ?? 'Ukendt spil',
      key: k.serial ?? k.value ?? k.key ?? '',
      type: k.type ?? 'text',
      kinguinId: k.kinguinId,
    }))
    .filter((k: any) => k.key)
}

async function handleOrderStatusChange(supabase: any, payload: any, eventName = 'order.status') {
  const orderId: string | undefined = payload.orderId
  const status: string | undefined = payload.status
  if (!orderId) return

  const now = new Date().toISOString()

  // order.complete means delivered by definition, so it counts even if the
  // envelope carries no status field at all.
  const isDelivered = eventName === 'order.complete' || status === 'completed'

  await supabase
    .from('kinguin_orders')
    .update({ status: status ?? (isDelivered ? 'completed' : 'unknown'), updated_at: now })
    .eq('order_id', orderId)

  if (isDelivered) {
    const keys = await fetchKeys(orderId)

    if (keys.length === 0) {
      // Delivered according to Kinguin but we could not read the keys. Leave
      // the order visibly unfinished rather than telling the customer it is
      // done with nothing to show them.
      console.error(`Order ${orderId} completed but no keys retrieved`)
      await supabase
        .from('orders')
        .update({
          status: 'fulfilling',
          error_message: 'Kinguin melder leveret, men nøglerne kunne ikke hentes. Kontakt support.',
          updated_at: now,
        })
        .eq('kinguin_order_id', orderId)
      return
    }

    await supabase.from('kinguin_orders').update({ keys, updated_at: now }).eq('order_id', orderId)

    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .eq('kinguin_order_id', orderId)
      .maybeSingle()

    if (order) {
      await supabase
        .from('orders')
        .update({ status: 'completed', keys, error_message: null, updated_at: now })
        .eq('id', order.id)

      // Attach one key per line item so it shows on the order detail view.
      const { data: items } = await supabase
        .from('order_items')
        .select('id, kinguin_id, game_key')
        .eq('order_id', order.id)

      const pool = [...keys]
      for (const item of items || []) {
        if (item.game_key) continue
        const idx = pool.findIndex((k: any) => !k.kinguinId || k.kinguinId === item.kinguin_id)
        if (idx === -1) continue
        const [match] = pool.splice(idx, 1)
        await supabase.from('order_items').update({ game_key: match.key }).eq('id', item.id)
      }
    }

    console.log(`Order ${orderId} completed with ${keys.length} key(s)`)
    return
  }

  if (status === 'canceled' || status === 'cancelled' || status === 'refunded') {
    await supabase
      .from('orders')
      .update({
        status: 'failed',
        error_message: `Kinguin annullerede ordren (${status}). Kunden skal refunderes.`,
        updated_at: now,
      })
      .eq('kinguin_order_id', orderId)
  }
}

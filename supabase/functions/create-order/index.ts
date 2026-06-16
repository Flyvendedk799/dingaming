import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'
import { getStoreSettings, calculateFinalPrice } from '../_shared/pricing.ts'
import { evaluateDiscount } from '../_shared/discount.ts'

const VAT_RATE = 0.25 // Danish VAT, already included in the price (shown for info)

interface IncomingItem {
  kinguinId: number
  quantity: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const body = await req.json()
    const items: IncomingItem[] = body.items || []
    const email: string = (body.email || '').trim()
    const customerName: string | null = body.customerName?.trim() || null
    const discountCode: string | null = body.discountCode?.trim() || null

    if (!items.length) return json({ error: 'Cart is empty' }, 400)
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ error: 'A valid email is required' }, 400)
    }

    // Resolve the (optional) logged-in user so we can link the order + award shards.
    let userId: string | null = null
    const authHeader = req.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const { data } = await supabase.auth.getUser(token)
      userId = data.user?.id ?? null
    }

    const settings = await getStoreSettings(supabase)

    // Re-price every line from the catalog. The client price is never trusted.
    const kinguinIds = items.map((i) => i.kinguinId)
    const { data: products, error: prodErr } = await supabase
      .from('kinguin_products')
      .select('kinguin_id, name, cover_image, platform, sell_price, original_price, margin_percent, is_available, qty')
      .in('kinguin_id', kinguinIds)

    if (prodErr) return json({ error: 'Failed to load products' }, 500)

    const byId = new Map<number, any>((products || []).map((p: any) => [p.kinguin_id, p]))
    const orderItems: any[] = []
    let subtotal = 0

    for (const item of items) {
      const product = byId.get(item.kinguinId)
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1))
      if (!product) return json({ error: `Product ${item.kinguinId} not found` }, 400)
      if (!product.is_available) return json({ error: `${product.name} is no longer available` }, 400)

      const unitPrice = calculateFinalPrice(product.sell_price, product.margin_percent, settings)
      const lineTotal = Math.round(unitPrice * qty * 100) / 100
      subtotal += lineTotal

      orderItems.push({
        kinguin_id: product.kinguin_id,
        name: product.name,
        cover_image: product.cover_image,
        platform: product.platform,
        unit_price: unitPrice,
        quantity: qty,
        line_total: lineTotal,
      })
    }

    subtotal = Math.round(subtotal * 100) / 100

    // Validate discount authoritatively.
    let discount = 0
    let appliedCode: string | null = null
    if (discountCode) {
      const result = await evaluateDiscount(supabase, discountCode, subtotal)
      if (result.valid) {
        discount = result.savings
        appliedCode = result.code ?? discountCode
      } else {
        return json({ error: 'invalid_discount', reason: result.reason }, 400)
      }
    }

    const total = Math.round((subtotal - discount) * 100) / 100
    const tax = Math.round(total * (VAT_RATE / (1 + VAT_RATE)) * 100) / 100 // VAT portion of a gross price

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        email,
        customer_name: customerName,
        status: 'pending',
        payment_status: 'unpaid',
        currency: 'DKK',
        subtotal,
        discount,
        discount_code: appliedCode,
        tax,
        total,
      })
      .select('id, order_number, subtotal, discount, total, email')
      .single()

    if (orderErr || !order) {
      console.error('Order insert failed:', orderErr)
      return json({ error: 'Could not create order' }, 500)
    }

    const itemsToInsert = orderItems.map((it) => ({ ...it, order_id: order.id }))
    const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert)
    if (itemsErr) {
      console.error('Order items insert failed:', itemsErr)
      await supabase.from('orders').delete().eq('id', order.id)
      return json({ error: 'Could not create order items' }, 500)
    }

    return json({
      orderId: order.id,
      orderNumber: order.order_number,
      subtotal: order.subtotal,
      discount: order.discount,
      total: order.total,
      email: order.email,
    })
  } catch (error) {
    console.error('create-order error:', error)
    return json({ error: 'Server error' }, 500)
  }
})

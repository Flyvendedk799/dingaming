import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'
import { fulfillOrder } from '../_shared/fulfillment.ts'

// Stripe-ready payment seam.
//
//  - If STRIPE_SECRET_KEY is configured, this creates a Stripe PaymentIntent and
//    returns its client_secret. The frontend confirms it with Stripe.js and the
//    order is completed asynchronously by the stripe-webhook function.
//  - If STRIPE_SECRET_KEY is NOT set (local/dev), it simulates a successful
//    payment immediately and runs fulfillment so the full flow is testable
//    without any payment provider.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { orderId } = await req.json()
    if (!orderId) return json({ error: 'orderId required' }, 400)

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, total, currency, payment_status, status, email')
      .eq('id', orderId)
      .maybeSingle()

    if (error || !order) return json({ error: 'Order not found' }, 404)
    if (order.payment_status === 'paid') {
      return json({ mode: 'already_paid', orderId, status: order.status })
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const amountMinor = Math.round(Number(order.total) * 100)

    if (stripeKey) {
      // --- Real Stripe path ---
      const params = new URLSearchParams()
      params.set('amount', String(amountMinor))
      params.set('currency', (order.currency || 'DKK').toLowerCase())
      params.set('metadata[order_id]', order.id)
      params.set('receipt_email', order.email)
      params.set('automatic_payment_methods[enabled]', 'true')

      const res = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      })

      const intent = await res.json()
      if (!res.ok) {
        console.error('Stripe error:', intent)
        return json({ error: 'Payment provider error' }, 502)
      }

      await supabase
        .from('orders')
        .update({ payment_ref: intent.id, payment_provider: 'stripe' })
        .eq('id', order.id)

      return json({
        mode: 'stripe',
        orderId: order.id,
        clientSecret: intent.client_secret,
        publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY') ?? null,
      })
    }

    // --- Dev path: simulate an instant successful payment ---
    await supabase
      .from('orders')
      .update({ payment_status: 'paid', status: 'paid', payment_provider: 'dev' })
      .eq('id', order.id)

    const result = await fulfillOrder(supabase, order.id)
    if (!result.ok) {
      return json({ mode: 'dev', orderId: order.id, status: 'failed', error: result.error }, 500)
    }

    const { data: updated } = await supabase
      .from('orders')
      .select('status')
      .eq('id', order.id)
      .maybeSingle()

    return json({ mode: 'dev', orderId: order.id, status: updated?.status ?? 'completed' })
  } catch (error) {
    console.error('process-payment error:', error)
    return json({ error: 'Server error' }, 500)
  }
})

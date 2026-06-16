import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'
import { fulfillOrder } from '../_shared/fulfillment.ts'

// Receives Stripe events. On `payment_intent.succeeded` it marks the matching
// order paid and runs fulfillment. Signature is verified against
// STRIPE_WEBHOOK_SECRET using Stripe's HMAC-SHA256 scheme.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  const signature = req.headers.get('stripe-signature')
  const rawBody = await req.text()

  if (webhookSecret) {
    const verified = await verifyStripeSignature(rawBody, signature, webhookSecret)
    if (!verified) {
      console.error('Stripe signature verification failed')
      return json({ error: 'Invalid signature' }, 400)
    }
  } else {
    console.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification (dev only)')
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return json({ error: 'Invalid payload' }, 400)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object
      const orderId = intent.metadata?.order_id

      const query = orderId
        ? supabase.from('orders').select('id, payment_status').eq('id', orderId)
        : supabase.from('orders').select('id, payment_status').eq('payment_ref', intent.id)

      const { data: order } = await query.maybeSingle()
      if (order && order.payment_status !== 'paid') {
        await supabase
          .from('orders')
          .update({ payment_status: 'paid', status: 'paid', payment_ref: intent.id })
          .eq('id', order.id)
        await fulfillOrder(supabase, order.id)
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object
      const orderId = intent.metadata?.order_id
      if (orderId) {
        await supabase
          .from('orders')
          .update({ status: 'failed', error_message: intent.last_payment_error?.message ?? 'Payment failed' })
          .eq('id', orderId)
      }
    }
  } catch (e) {
    console.error('stripe-webhook processing error:', e)
    return json({ error: 'Processing error' }, 500)
  }

  return json({ received: true })
})

async function verifyStripeSignature(
  payload: string,
  sigHeader: string | null,
  secret: string,
): Promise<boolean> {
  if (!sigHeader) return false
  const parts = Object.fromEntries(
    sigHeader.split(',').map((kv) => kv.split('=') as [string, string]),
  )
  const timestamp = parts['t']
  const expectedSig = parts['v1']
  if (!timestamp || !expectedSig) return false

  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${payload}`))
  const computed = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // Constant-time-ish comparison.
  if (computed.length !== expectedSig.length) return false
  let mismatch = 0
  for (let i = 0; i < computed.length; i++) {
    mismatch |= computed.charCodeAt(i) ^ expectedSig.charCodeAt(i)
  }
  return mismatch === 0
}

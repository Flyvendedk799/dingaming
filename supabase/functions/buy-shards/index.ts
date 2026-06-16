import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'

// Purchase a shard bundle (in-app currency top-up). This is intentionally
// separate from the product checkout because shards are not catalog items.
//
// Payment seam: when STRIPE_SECRET_KEY is configured this should create a
// PaymentIntent and only credit shards after the stripe-webhook confirms
// payment. Until Stripe is connected we credit instantly (dev mode) so the
// flow is usable end-to-end.

interface Bundle {
  id: string
  totalShards: number
  priceDkk: number
}

const BUNDLES: Record<string, Bundle> = {
  'SHARDS-5000': { id: 'SHARDS-5000', totalShards: 5100, priceDkk: 5 },
  'SHARDS-10000': { id: 'SHARDS-10000', totalShards: 10400, priceDkk: 10 },
  'SHARDS-25000': { id: 'SHARDS-25000', totalShards: 26500, priceDkk: 25 },
  'SHARDS-50000': { id: 'SHARDS-50000', totalShards: 54000, priceDkk: 50 },
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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) return json({ error: 'Invalid token' }, 401)

    const { bundleId } = await req.json()
    const bundle = BUNDLES[bundleId]
    if (!bundle) return json({ error: 'Unknown bundle' }, 400)

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (stripeKey) {
      // Stripe is configured but shard-bundle PaymentIntent confirmation +
      // crediting via webhook is not wired into the UI yet.
      return json(
        { mode: 'stripe', error: 'Shard purchases via Stripe are not enabled yet.' },
        501,
      )
    }

    // Dev mode: credit instantly.
    const { error } = await supabase.from('shard_transactions').insert({
      user_id: user.id,
      amount: bundle.totalShards,
      type: 'purchase_shards',
      description: `Købt ${bundle.totalShards.toLocaleString('da-DK')} shards (${bundle.priceDkk} kr)`,
      reference_id: bundle.id,
    })
    if (error) {
      console.error('buy-shards credit failed:', error)
      return json({ error: 'Could not credit shards' }, 500)
    }

    const { data: balance } = await supabase
      .from('shard_balances')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle()

    return json({ mode: 'dev', credited: bundle.totalShards, newBalance: balance?.balance ?? 0 })
  } catch (error) {
    console.error('buy-shards error:', error)
    return json({ error: 'Server error' }, 500)
  }
})

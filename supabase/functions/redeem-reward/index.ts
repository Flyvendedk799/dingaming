import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = user.id
    const { rewardId } = await req.json()

    if (!rewardId) {
      return new Response(JSON.stringify({ error: 'Missing rewardId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get reward details
    const { data: reward, error: rewardError } = await supabase
      .from('reward_items')
      .select('*')
      .eq('id', rewardId)
      .eq('is_active', true)
      .single()

    if (rewardError || !reward) {
      return new Response(JSON.stringify({ error: 'Reward not found or inactive' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (reward.stock !== null && reward.stock <= 0) {
      return new Response(JSON.stringify({ error: 'Reward out of stock' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user's shard balance
    const { data: balance, error: balanceError } = await supabase
      .from('shard_balances')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (balanceError || !balance) {
      return new Response(JSON.stringify({ error: 'User balance not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (balance.balance < reward.shard_cost) {
      return new Response(JSON.stringify({ error: 'Insufficient shards' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Expiration: 30 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Generate a native, single-use discount code for voucher rewards. This
    // plugs straight into the in-app checkout (see functions/validate-discount).
    let voucherCode: string | null = null
    if (reward.type === 'voucher' && reward.value_dkk) {
      voucherCode = `CLUB-${crypto.randomUUID().split('-')[0].toUpperCase()}`
      const { error: codeError } = await supabase.from('discount_codes').insert({
        code: voucherCode,
        type: 'fixed',
        value: reward.value_dkk,
        max_uses: 1,
        is_active: true,
        expires_at: expiresAt.toISOString(),
      })
      if (codeError) {
        console.error('Failed to create discount code:', codeError)
        throw new Error('Failed to create voucher')
      }
    }

    // Insert user reward
    const { error: userRewardError } = await supabase.from('user_rewards').insert({
      user_id: userId,
      reward_id: rewardId,
      shards_spent: reward.shard_cost,
      voucher_code: voucherCode,
      status: 'active',
      expires_at: expiresAt.toISOString(),
    })

    if (userRewardError) {
      console.error('Failed to insert user reward:', userRewardError)
      throw new Error('Failed to create user reward')
    }

    // Deduct shards (negative transaction, trigger updates balance)
    const { error: txError } = await supabase.from('shard_transactions').insert({
      user_id: userId,
      amount: -reward.shard_cost,
      type: 'redemption',
      description: `Indløst: ${reward.name}`,
      reference_id: rewardId,
    })

    if (txError) {
      console.error('Failed to insert shard transaction:', txError)
      throw new Error('Failed to deduct shards')
    }

    // Decrease stock if limited
    if (reward.stock !== null) {
      await supabase.from('reward_items').update({ stock: reward.stock - 1 }).eq('id', rewardId)
    }

    // Get updated balance
    const { data: newBalance } = await supabase
      .from('shard_balances')
      .select('balance')
      .eq('user_id', userId)
      .single()

    return new Response(
      JSON.stringify({
        success: true,
        voucherCode,
        rewardName: reward.name,
        shardsSpent: reward.shard_cost,
        newBalance: newBalance?.balance || 0,
        expiresAt: expiresAt.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Error in redeem-reward:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

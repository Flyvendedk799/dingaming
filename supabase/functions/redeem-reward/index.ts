import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SHOPIFY_STORE_DOMAIN = Deno.env.get('SHOPIFY_STORE_DOMAIN') || ''
const SHOPIFY_ACCESS_TOKEN = Deno.env.get('SHOPIFY_ACCESS_TOKEN') || ''

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
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = user.id
    const { rewardId } = await req.json()

    if (!rewardId) {
      return new Response(
        JSON.stringify({ error: 'Missing rewardId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get reward details
    const { data: reward, error: rewardError } = await supabase
      .from('reward_items')
      .select('*')
      .eq('id', rewardId)
      .eq('is_active', true)
      .single()

    if (rewardError || !reward) {
      return new Response(
        JSON.stringify({ error: 'Reward not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check stock if limited
    if (reward.stock !== null && reward.stock <= 0) {
      return new Response(
        JSON.stringify({ error: 'Reward out of stock' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's shard balance
    const { data: balance, error: balanceError } = await supabase
      .from('shard_balances')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (balanceError || !balance) {
      return new Response(
        JSON.stringify({ error: 'User balance not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has enough shards
    if (balance.balance < reward.shard_cost) {
      return new Response(
        JSON.stringify({ error: 'Insufficient shards' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate voucher code for voucher type rewards
    let voucherCode: string | null = null
    if (reward.type === 'voucher' && reward.value_dkk) {
      voucherCode = await createShopifyDiscountCode(reward.value_dkk, reward.name)
    }

    // Calculate expiration (30 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Insert user reward
    const { error: userRewardError } = await supabase
      .from('user_rewards')
      .insert({
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
    const { error: txError } = await supabase
      .from('shard_transactions')
      .insert({
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
      await supabase
        .from('reward_items')
        .update({ stock: reward.stock - 1 })
        .eq('id', rewardId)
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
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in redeem-reward:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to create Shopify discount code
async function createShopifyDiscountCode(valueDkk: number, rewardName: string): Promise<string> {
  // Generate unique code
  const code = `CLUB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
    console.warn('Shopify credentials not configured, returning generated code only')
    return code
  }

  try {
    // Create price rule first
    const priceRuleResponse = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/price_rules.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          price_rule: {
            title: `Customer Club: ${rewardName}`,
            target_type: 'line_item',
            target_selection: 'all',
            allocation_method: 'across',
            value_type: 'fixed_amount',
            value: `-${valueDkk}`,
            customer_selection: 'all',
            once_per_customer: true,
            usage_limit: 1,
            starts_at: new Date().toISOString(),
            ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        }),
      }
    )

    if (!priceRuleResponse.ok) {
      throw new Error('Failed to create price rule')
    }

    const priceRuleData = await priceRuleResponse.json()
    const priceRuleId = priceRuleData.price_rule.id

    // Create discount code
    const discountResponse = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/price_rules/${priceRuleId}/discount_codes.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          discount_code: {
            code,
          },
        }),
      }
    )

    if (!discountResponse.ok) {
      throw new Error('Failed to create discount code')
    }

    return code
  } catch (error) {
    console.error('Shopify API error:', error)
    // Return generated code even if Shopify fails
    return code
  }
}

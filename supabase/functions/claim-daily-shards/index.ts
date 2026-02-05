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
    const today = new Date().toISOString().split('T')[0]

    // Check if already claimed today
    const { data: existingLogin } = await supabase
      .from('daily_logins')
      .select('*')
      .eq('user_id', userId)
      .eq('login_date', today)
      .maybeSingle()

    if (existingLogin) {
      return new Response(
        JSON.stringify({ error: 'Daily shards already claimed today' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get yesterday's login to check streak
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const { data: yesterdayLogin } = await supabase
      .from('daily_logins')
      .select('streak_count')
      .eq('user_id', userId)
      .eq('login_date', yesterdayStr)
      .maybeSingle()

    // Calculate streak
    const streakCount = yesterdayLogin ? yesterdayLogin.streak_count + 1 : 1

    // Get earning rules
    const { data: rule } = await supabase
      .from('shard_earning_rules')
      .select('base_shards, streak_multiplier')
      .eq('action_type', 'daily_login')
      .eq('is_active', true)
      .maybeSingle()

    // Calculate shards based on streak
    let shardsToAward = rule?.base_shards || 50

    // Streak bonuses: Day 1 = 50, Day 2 = 75, ..., Day 7+ = 200+
    if (streakCount <= 6) {
      shardsToAward = 50 + (streakCount - 1) * 25
    } else {
      // Day 7+: 200 base + 25 extra per week
      const weeksCompleted = Math.floor((streakCount - 7) / 7)
      shardsToAward = 200 + (weeksCompleted * 25)
    }

    // Insert daily login record
    const { error: loginError } = await supabase
      .from('daily_logins')
      .insert({
        user_id: userId,
        login_date: today,
        streak_count: streakCount,
        shards_awarded: shardsToAward,
      })

    if (loginError) {
      console.error('Failed to insert daily login:', loginError)
      throw new Error('Failed to record daily login')
    }

    // Insert shard transaction (trigger will update balance)
    const { error: txError } = await supabase
      .from('shard_transactions')
      .insert({
        user_id: userId,
        amount: shardsToAward,
        type: 'daily_login',
        description: streakCount > 1 
          ? `Daglig login bonus (${streakCount} dage streak!)` 
          : 'Daglig login bonus',
        reference_id: today,
      })

    if (txError) {
      console.error('Failed to insert shard transaction:', txError)
      throw new Error('Failed to award shards')
    }

    // Get updated balance
    const { data: balance } = await supabase
      .from('shard_balances')
      .select('balance')
      .eq('user_id', userId)
      .single()

    return new Response(
      JSON.stringify({
        success: true,
        shardsAwarded: shardsToAward,
        streakCount,
        newBalance: balance?.balance || 0,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in claim-daily-shards:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

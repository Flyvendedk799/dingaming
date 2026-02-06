import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Calculate multiplier based on win chance
function calculateMultiplier(winChance: number): number {
  // House edge of 3%
  const payout = (100 / winChance) * 0.97;
  return Math.floor(payout * 100) / 100;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role key for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Use anon key client for auth verification
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user using getClaims (more reliable than getUser)
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Token verification failed:", claimsError?.message || "No claims");
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;

    const { betAmount, targetNumber, isOver } = await req.json();

    // Validate inputs
    if (!betAmount || betAmount < 10) {
      return new Response(
        JSON.stringify({ error: "Minimum bet is 10 shards" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (targetNumber === undefined || targetNumber < 1 || targetNumber > 98) {
      return new Response(
        JSON.stringify({ error: "Target number must be between 1 and 98" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (isOver === undefined) {
      return new Response(
        JSON.stringify({ error: "Must specify over or under" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's current balance
    const { data: balanceData, error: balanceError } = await supabaseAdmin
      .from("shard_balances")
      .select("balance, lifetime_earned, lifetime_spent")
      .eq("user_id", userId)
      .single();

    if (balanceError) {
      return new Response(
        JSON.stringify({ error: "Could not fetch balance" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentBalance = balanceData?.balance || 0;

    if (betAmount > currentBalance) {
      return new Response(
        JSON.stringify({ error: "Insufficient balance" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate win chance and multiplier
    const winChance = isOver ? (99 - targetNumber) : (targetNumber - 1);
    
    if (winChance < 1 || winChance > 98) {
      return new Response(
        JSON.stringify({ error: "Invalid win chance" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const multiplier = calculateMultiplier(winChance);

    // Generate random roll (1-100)
    const roll = Math.floor(Math.random() * 100) + 1;

    // Determine win
    const isWin = isOver ? roll > targetNumber : roll < targetNumber;

    // Calculate win amount
    const winAmount = isWin ? Math.floor(betAmount * multiplier) : 0;

    // Record transactions - the database trigger handles balance updates
    // NOTE: Removed direct shard_balances update to fix double-deduction bug
    const transactions = [
      {
        user_id: userId,
        amount: -betAmount,
        type: "game_bet",
        description: `Dice indsats (${isOver ? 'over' : 'under'} ${targetNumber})`,
        reference_id: `dice_${Date.now()}`,
      },
    ];

    if (isWin) {
      transactions.push({
        user_id: userId,
        amount: winAmount,
        type: "game_win",
        description: `Dice gevinst (x${multiplier})`,
        reference_id: `dice_win_${Date.now()}`,
      });
    }

    await supabaseAdmin.from("shard_transactions").insert(transactions);

    // Record game result
    await supabaseAdmin.from("game_sessions").insert({
      session_id: `dice_${userId}_${Date.now()}`,
      user_id: userId,
      game_type: "dice",
      state: {
        betAmount,
        targetNumber,
        isOver,
        roll,
        isWin,
        multiplier,
        winAmount,
      },
      is_active: false,
      ended_at: new Date().toISOString(),
    });

    // Calculate new balance based on transactions
    // The trigger will update the balance, but we need to return the expected new balance
    const newBalance = currentBalance - betAmount + winAmount;

    return new Response(
      JSON.stringify({
        success: true,
        roll,
        isWin,
        targetNumber,
        isOver,
        multiplier,
        betAmount,
        winAmount: isWin ? winAmount : 0,
        newBalance,
        winChance,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Play dice error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

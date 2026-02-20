import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// European roulette: 0-36
const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

interface Bet {
  type: "number" | "red" | "black" | "odd" | "even" | "1-18" | "19-36" | "1st12" | "2nd12" | "3rd12";
  value?: number; // only for "number" type
  amount: number;
}

function getPayoutMultiplier(betType: string): number {
  switch (betType) {
    case "number": return 36;
    case "red": case "black": case "odd": case "even": case "1-18": case "19-36": return 2;
    case "1st12": case "2nd12": case "3rd12": return 3;
    default: return 0;
  }
}

function isBetWin(bet: Bet, result: number): boolean {
  if (result === 0) return bet.type === "number" && bet.value === 0;
  
  switch (bet.type) {
    case "number": return bet.value === result;
    case "red": return RED_NUMBERS.includes(result);
    case "black": return !RED_NUMBERS.includes(result);
    case "odd": return result % 2 === 1;
    case "even": return result % 2 === 0;
    case "1-18": return result >= 1 && result <= 18;
    case "19-36": return result >= 19 && result <= 36;
    case "1st12": return result >= 1 && result <= 12;
    case "2nd12": return result >= 13 && result <= 24;
    case "3rd12": return result >= 25 && result <= 36;
    default: return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = userData.user.id;
    const { bets } = await req.json() as { bets: Bet[] };

    if (!bets || !Array.isArray(bets) || bets.length === 0) {
      return new Response(JSON.stringify({ error: "No bets placed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Validate bets
    const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);
    if (totalBet < 10) {
      return new Response(JSON.stringify({ error: "Minimum total bet is 10 shards" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    for (const bet of bets) {
      if (bet.amount < 10) {
        return new Response(JSON.stringify({ error: "Each bet must be at least 10 shards" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (bet.type === "number" && (bet.value === undefined || bet.value < 0 || bet.value > 36)) {
        return new Response(JSON.stringify({ error: "Invalid number bet" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Fetch balance
    const { data: balanceData, error: balanceError } = await supabaseAdmin
      .from("shard_balances").select("balance").eq("user_id", userId).single();

    if (balanceError) {
      return new Response(JSON.stringify({ error: "Could not fetch balance" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (totalBet > (balanceData?.balance || 0)) {
      return new Response(JSON.stringify({ error: "Insufficient balance" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Spin the wheel
    const result = Math.floor(Math.random() * 37); // 0-36
    const isRed = RED_NUMBERS.includes(result);

    // Calculate winnings
    let totalWin = 0;
    const betResults = bets.map(bet => {
      const won = isBetWin(bet, result);
      const payout = won ? bet.amount * getPayoutMultiplier(bet.type) : 0;
      totalWin += payout;
      return { ...bet, won, payout };
    });

    // Deduct total bet
    const deductPromise = supabaseAdmin.from("shard_transactions").insert({
      user_id: userId, amount: -totalBet, type: "game_bet",
      description: `Roulette indsats`, reference_id: `roulette_${Date.now()}`,
    });

    await deductPromise;

    // Award winnings and record session in parallel
    const promises: Promise<any>[] = [
      supabaseAdmin.from("game_sessions").insert({
        session_id: `roulette_${userId}_${Date.now()}`,
        user_id: userId, game_type: "roulette",
        state: { bets: betResults, result, totalBet, totalWin, isRed },
        is_active: false, ended_at: new Date().toISOString(),
      }),
    ];

    if (totalWin > 0) {
      promises.push(supabaseAdmin.from("shard_transactions").insert({
        user_id: userId, amount: totalWin, type: "game_win",
        description: `Roulette gevinst (${result})`, reference_id: `roulette_win_${Date.now()}`,
      }));
    }

    await Promise.all(promises);

    return new Response(JSON.stringify({
      success: true, result, isRed: result > 0 ? isRed : null,
      betResults, totalBet, totalWin,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: unknown) {
    console.error("Play roulette error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

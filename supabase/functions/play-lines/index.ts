import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Same math as play-dice: winChance 1–98, house edge 3%
function calcMultiplier(winChance: number): number {
  const payout = (100 / winChance) * 0.97;
  return Math.floor(payout * 100) / 100;
}

interface LineConfig {
  targetNumber: number; // 2–98
  isOver: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Not authenticated");

    const body = await req.json();
    const { betAmount, lineConfigs } = body as {
      betAmount: number;
      lineConfigs: LineConfig[];
    };

    // Validate
    if (!betAmount || betAmount < 10) throw new Error("Minimum bet is 10 shards");
    if (!lineConfigs || lineConfigs.length < 1 || lineConfigs.length > 5) {
      throw new Error("Must have 1–5 lines");
    }
    for (const cfg of lineConfigs) {
      if (cfg.targetNumber < 2 || cfg.targetNumber > 98) {
        throw new Error("Target number must be 2–98");
      }
    }

    const lines = lineConfigs.length;
    const totalBet = betAmount * lines;

    // Check balance
    const { data: balData } = await supabaseAdmin
      .from("shard_balances")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (!balData || balData.balance < totalBet) {
      throw new Error("Ikke nok shards");
    }

    // Roll each line independently (same as dice: random 1–100)
    const lineResults = lineConfigs.map((cfg) => {
      const roll = Math.floor(Math.random() * 100) + 1; // 1–100
      const winChance = cfg.isOver
        ? 99 - cfg.targetNumber  // over: numbers from target+1 to 99
        : cfg.targetNumber - 1;  // under: numbers from 1 to target-1
      const multiplier = calcMultiplier(winChance);
      const isWin = cfg.isOver ? roll > cfg.targetNumber : roll < cfg.targetNumber;
      return {
        roll,
        targetNumber: cfg.targetNumber,
        isOver: cfg.isOver,
        winChance,
        multiplier,
        isWin,
      };
    });

    // Payout: each winning line contributes its multiplier multiplicatively
    // Total win = betAmount × (product of winning line multipliers)
    const winningLines = lineResults.filter((l) => l.isWin);
    let combinedMultiplier = 0;
    let totalWin = 0;
    if (winningLines.length > 0) {
      combinedMultiplier = winningLines.reduce((acc, l) => acc * l.multiplier, 1);
      combinedMultiplier = Math.floor(combinedMultiplier * 100) / 100;
      totalWin = Math.floor(betAmount * combinedMultiplier);
    }
    const netResult = totalWin - totalBet;
    const newBalance = balData.balance - totalBet + totalWin;

    const winsCount = winningLines.length;

    // Persist
    await Promise.all([
      supabaseAdmin
        .from("shard_balances")
        .update({ balance: newBalance })
        .eq("user_id", user.id),
      supabaseAdmin.from("shard_transactions").insert({
        user_id: user.id,
        amount: netResult,
        type: netResult >= 0 ? "game_win" : "game_bet",
        description: `Lines (${lines} linjer): ${winsCount}/${lines} vandt${winsCount > 0 ? ` x${combinedMultiplier}` : ""}`,
      }),
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        lineResults,
        combinedMultiplier,
        totalBet,
        totalWin,
        netResult,
        newBalance,
        winningLinesCount: winsCount,
        allWon: winsCount === lines,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

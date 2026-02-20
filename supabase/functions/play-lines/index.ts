import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Symbol definitions with weights and multipliers
// Each line rolls 3 dice (symbols). A line wins if all 3 match.
const SYMBOLS = [
  { id: "gem",     emoji: "💎", label: "Gem",     weight: 3,  multiplier: 50  },
  { id: "crown",   emoji: "👑", label: "Crown",   weight: 5,  multiplier: 25  },
  { id: "fire",    emoji: "🔥", label: "Fire",    weight: 8,  multiplier: 12  },
  { id: "bolt",    emoji: "⚡", label: "Bolt",    weight: 10, multiplier: 8   },
  { id: "star",    emoji: "⭐", label: "Star",    weight: 15, multiplier: 5   },
  { id: "coin",    emoji: "🪙", label: "Coin",    weight: 20, multiplier: 3   },
  { id: "crystal", emoji: "🔷", label: "Crystal", weight: 25, multiplier: 2   },
  { id: "dice",    emoji: "🎲", label: "Dice",    weight: 30, multiplier: 1.5 },
];

const TOTAL_WEIGHT = SYMBOLS.reduce((s, x) => s + x.weight, 0);

function rollSymbol() {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const sym of SYMBOLS) {
    r -= sym.weight;
    if (r <= 0) return sym;
  }
  return SYMBOLS[SYMBOLS.length - 1];
}

function rollLine(): typeof SYMBOLS[number][] {
  return [rollSymbol(), rollSymbol(), rollSymbol()];
}

function evaluateLine(dice: typeof SYMBOLS[number][]) {
  const [a, b, c] = dice;
  if (a.id === b.id && b.id === c.id) {
    return { isWin: true, multiplier: a.multiplier, symbolId: a.id };
  }
  return { isWin: false, multiplier: 0, symbolId: null };
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
    const { betAmount, lines } = body;

    // Validate inputs
    if (!betAmount || betAmount < 10) throw new Error("Minimum bet is 10 shards");
    if (!lines || lines < 1 || lines > 5) throw new Error("Lines must be 1–5");

    const totalBet = betAmount * lines;

    // Get balance
    const { data: balData } = await supabaseAdmin
      .from("shard_balances")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (!balData || balData.balance < totalBet) {
      throw new Error("Ikke nok shards");
    }

    // Roll all lines
    const lineResults = Array.from({ length: lines }, () => {
      const dice = rollLine();
      const { isWin, multiplier, symbolId } = evaluateLine(dice);
      return { dice, isWin, multiplier, symbolId };
    });

    const winningLines = lineResults.filter(l => l.isWin);
    const totalWin = winningLines.reduce((sum, l) => sum + Math.floor(betAmount * l.multiplier), 0);
    const netResult = totalWin - totalBet;
    const newBalance = balData.balance - totalBet + totalWin;

    // Update balance + record transactions in parallel
    await Promise.all([
      supabaseAdmin
        .from("shard_balances")
        .update({ balance: newBalance })
        .eq("user_id", user.id),
      supabaseAdmin.from("shard_transactions").insert({
        user_id: user.id,
        amount: netResult,
        type: netResult >= 0 ? "game_win" : "game_bet",
        description: `Lines (${lines} linjer): ${winningLines.length} gevinst${winningLines.length !== 1 ? "er" : ""}`,
      }),
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        lineResults: lineResults.map(l => ({
          dice: l.dice.map(d => ({ id: d.id, emoji: d.emoji, label: d.label, multiplier: d.multiplier })),
          isWin: l.isWin,
          multiplier: l.multiplier,
          win: l.isWin ? Math.floor(betAmount * l.multiplier) : 0,
        })),
        totalBet,
        totalWin,
        netResult,
        newBalance,
        winningLines: winningLines.length,
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

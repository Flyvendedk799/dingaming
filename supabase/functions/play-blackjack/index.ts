import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Card = { suit: string; rank: string; value: number };

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      let value = parseInt(rank);
      if (["J","Q","K"].includes(rank)) value = 10;
      if (rank === "A") value = 11;
      deck.push({ suit, rank, value });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function handValue(cards: Card[]): number {
  let total = cards.reduce((s, c) => s + c.value, 0);
  let aces = cards.filter(c => c.rank === "A").length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handValue(cards) === 21;
}

interface BlackjackState {
  deck: Card[];
  playerHand: Card[];
  dealerHand: Card[];
  betAmount: number;
  status: string;
  winAmount: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fast auth: use getUser directly
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;
    const { action, betAmount, sessionId } = await req.json();

    // ---- DEAL ----
    if (action === "deal") {
      if (!betAmount || betAmount < 10) {
        return new Response(JSON.stringify({ error: "Minimum bet is 10 shards" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Parallel: fetch balance + check existing session
      const [balanceRes, existingRes] = await Promise.all([
        supabaseAdmin.from("shard_balances").select("balance").eq("user_id", userId).single(),
        supabaseAdmin.from("game_sessions").select("*").eq("user_id", userId).eq("game_type", "blackjack").eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      if (balanceRes.error) {
        return new Response(JSON.stringify({ error: "Could not fetch balance" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const currentBalance = balanceRes.data?.balance || 0;
      if (betAmount > currentBalance) {
        return new Response(JSON.stringify({ error: "Insufficient balance" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (existingRes.data) {
        const state = existingRes.data.state as unknown as BlackjackState;
        return new Response(JSON.stringify({
          success: true, restored: true,
          sessionId: existingRes.data.session_id,
          playerHand: state.playerHand,
          dealerHand: [state.dealerHand[0]],
          playerValue: handValue(state.playerHand),
          dealerValue: state.dealerHand[0].value,
          betAmount: state.betAmount,
          status: state.status,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Deduct bet (don't await – fire and continue)
      const betRef = `bj_${Date.now()}`;
      const deductPromise = supabaseAdmin.from("shard_transactions").insert({
        user_id: userId, amount: -betAmount, type: "game_bet",
        description: "Blackjack indsats", reference_id: betRef,
      });

      const deck = createDeck();
      const playerHand = [deck.pop()!, deck.pop()!];
      const dealerHand = [deck.pop()!, deck.pop()!];

      let status: string = "playing";
      let winAmount = 0;

      const playerBJ = isBlackjack(playerHand);
      const dealerBJ = isBlackjack(dealerHand);

      if (playerBJ && dealerBJ) { status = "push"; winAmount = betAmount; }
      else if (playerBJ) { status = "blackjack"; winAmount = Math.floor(betAmount * 2.5); }
      else if (dealerBJ) { status = "dealer_win"; winAmount = 0; }

      const newSessionId = `${userId}_bj_${Date.now()}`;
      const state: BlackjackState = { deck, playerHand, dealerHand, betAmount, status, winAmount };
      const isActive = status === "playing";

      // Wait for deduct, then insert session (and payout if needed) in parallel
      await deductPromise;

      const promises: Promise<any>[] = [
        supabaseAdmin.from("game_sessions").insert({
          session_id: newSessionId, user_id: userId, game_type: "blackjack",
          state: state as any, is_active: isActive,
          ended_at: isActive ? null : new Date().toISOString(),
        }),
      ];

      if (!isActive && winAmount > 0) {
        promises.push(supabaseAdmin.from("shard_transactions").insert({
          user_id: userId, amount: winAmount, type: "game_win",
          description: status === "blackjack" ? "Blackjack! (3:2)" : "Blackjack push",
          reference_id: newSessionId,
        }));
      }
      await Promise.all(promises);

      return new Response(JSON.stringify({
        success: true, sessionId: newSessionId, playerHand,
        dealerHand: isActive ? [dealerHand[0]] : dealerHand,
        playerValue: handValue(playerHand),
        dealerValue: isActive ? dealerHand[0].value : handValue(dealerHand),
        betAmount, status, winAmount,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---- HIT / STAND shared: fetch session ----
    if (action === "hit" || action === "stand") {
      if (!sessionId) {
        return new Response(JSON.stringify({ error: "Missing sessionId" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: sessionData, error: sessionError } = await supabaseAdmin
        .from("game_sessions").select("*")
        .eq("session_id", sessionId).eq("user_id", userId).eq("is_active", true).single();

      if (sessionError || !sessionData) {
        return new Response(JSON.stringify({ error: "Game session not found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const state = sessionData.state as unknown as BlackjackState;
      if (state.status !== "playing") {
        return new Response(JSON.stringify({ error: "Game already ended" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (action === "hit") {
        const newCard = state.deck.pop()!;
        state.playerHand.push(newCard);
        const pVal = handValue(state.playerHand);

        if (pVal > 21) {
          state.status = "player_bust";
          state.winAmount = 0;
          await supabaseAdmin.from("game_sessions").update({
            state: state as any, is_active: false, ended_at: new Date().toISOString(),
          }).eq("session_id", sessionId);

          return new Response(JSON.stringify({
            success: true, playerHand: state.playerHand, dealerHand: state.dealerHand,
            playerValue: pVal, dealerValue: handValue(state.dealerHand), status: "player_bust", winAmount: 0,
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (pVal === 21) {
          return await resolveDealerTurn(supabaseAdmin, state, sessionId, userId);
        }

        await supabaseAdmin.from("game_sessions").update({ state: state as any }).eq("session_id", sessionId);

        return new Response(JSON.stringify({
          success: true, playerHand: state.playerHand, dealerHand: [state.dealerHand[0]],
          playerValue: pVal, dealerValue: state.dealerHand[0].value, status: "playing",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // STAND
      return await resolveDealerTurn(supabaseAdmin, state, sessionId, userId);
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: deal, hit, stand" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Play blackjack error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function resolveDealerTurn(
  supabaseAdmin: any, state: BlackjackState, sessionId: string, userId: string
) {
  while (handValue(state.dealerHand) < 17) {
    state.dealerHand.push(state.deck.pop()!);
  }

  const pVal = handValue(state.playerHand);
  const dVal = handValue(state.dealerHand);

  if (dVal > 21) { state.status = "dealer_bust"; state.winAmount = state.betAmount * 2; }
  else if (pVal > dVal) { state.status = "player_win"; state.winAmount = state.betAmount * 2; }
  else if (dVal > pVal) { state.status = "dealer_win"; state.winAmount = 0; }
  else { state.status = "push"; state.winAmount = state.betAmount; }

  // Parallel: update session + insert payout
  const promises: Promise<any>[] = [
    supabaseAdmin.from("game_sessions").update({
      state: state as any, is_active: false, ended_at: new Date().toISOString(),
    }).eq("session_id", sessionId),
  ];

  if (state.winAmount > 0) {
    const desc = state.status === "push" ? "Blackjack push" : state.status === "dealer_bust" ? "Dealer bust!" : "Blackjack gevinst";
    promises.push(supabaseAdmin.from("shard_transactions").insert({
      user_id: userId, amount: state.winAmount, type: "game_win",
      description: desc, reference_id: sessionId,
    }));
  }

  await Promise.all(promises);

  return new Response(JSON.stringify({
    success: true, playerHand: state.playerHand, dealerHand: state.dealerHand,
    playerValue: pVal, dealerValue: dVal, status: state.status, winAmount: state.winAmount,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

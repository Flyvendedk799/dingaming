import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Card = { suit: string; rank: string; value: number; display: string };

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const VALUES: Record<string, number> = {
  A: 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
  "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13,
};

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, value: VALUES[rank], display: `${rank}${suit}` });
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Calculate payout multiplier based on current card
// Higher/lower cards have different probabilities
function getMultiplier(currentCard: Card, guess: "higher" | "lower"): number {
  const v = currentCard.value;
  // Cards that could beat the guess (excluding ties which push)
  let winCards: number;
  if (guess === "higher") {
    // How many ranks are higher?
    winCards = 13 - v; // e.g., if card is 5, there are 8 higher ranks (6-K)
  } else {
    winCards = v - 1; // e.g., if card is 5, there are 4 lower ranks (A-4)
  }

  if (winCards === 0) return 0; // Impossible bet

  // Probability = winCards / 12 (excluding same rank = push)
  const probability = winCards / 12;
  // Payout with 3% house edge
  const payout = (1 / probability) * 0.97;
  return Math.floor(payout * 100) / 100;
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

    const { action, betAmount, guess, sessionId } = await req.json();

    if (action === "start") {
      // --- START NEW GAME ---
      if (!betAmount || betAmount < 10) throw new Error("Minimum bet is 10");

      // Get balance
      const { data: balData } = await supabaseAdmin
        .from("shard_balances")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (!balData || balData.balance < betAmount) {
        throw new Error("Ikke nok shards");
      }

      // Create deck and draw first card
      const deck = createDeck();
      const firstCard = deck[0];
      const remainingDeck = deck.slice(1);

      const newSessionId = crypto.randomUUID();

      // Deduct bet + create session in parallel
      const [balUpdate, sessionInsert] = await Promise.all([
        supabaseAdmin
          .from("shard_balances")
          .update({ balance: balData.balance - betAmount })
          .eq("user_id", user.id),
        supabaseAdmin.from("game_sessions").insert({
          session_id: newSessionId,
          user_id: user.id,
          game_type: "hilo",
          is_active: true,
          state: {
            deck: remainingDeck,
            currentCard: firstCard,
            betAmount,
            streak: 0,
            currentMultiplier: 1,
            history: [firstCard],
          },
        }),
      ]);

      // Record transaction
      await supabaseAdmin.from("shard_transactions").insert({
        user_id: user.id,
        amount: -betAmount,
        type: "game_bet",
        description: `Hi-Lo indsats: ${betAmount} shards`,
      });

      // Calculate multipliers for display
      const higherMult = getMultiplier(firstCard, "higher");
      const lowerMult = getMultiplier(firstCard, "lower");

      return new Response(JSON.stringify({
        success: true,
        sessionId: newSessionId,
        currentCard: firstCard,
        streak: 0,
        currentMultiplier: 1,
        higherMultiplier: higherMult,
        lowerMultiplier: lowerMult,
        betAmount,
        potentialWin: betAmount,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } else if (action === "guess") {
      // --- GUESS HIGHER OR LOWER ---
      if (!sessionId || !guess) throw new Error("Missing sessionId or guess");
      if (guess !== "higher" && guess !== "lower") throw new Error("Invalid guess");

      const { data: session } = await supabaseAdmin
        .from("game_sessions")
        .select("*")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!session) throw new Error("No active session");

      const state = session.state as any;
      const currentCard = state.currentCard as Card;
      const deck = state.deck as Card[];

      if (deck.length === 0) throw new Error("No cards left");

      // Draw next card
      const nextCard = deck[0];
      const newDeck = deck.slice(1);

      // Determine result
      let isWin = false;
      let isTie = nextCard.value === currentCard.value;

      if (isTie) {
        // Push / tie — card replaces but streak continues (no gain, no loss)
        isWin = true; // Tie counts as survival but multiplier doesn't increase
      } else if (guess === "higher") {
        isWin = nextCard.value > currentCard.value;
      } else {
        isWin = nextCard.value < currentCard.value;
      }

      const newStreak = isWin ? state.streak + (isTie ? 0 : 1) : state.streak;
      const multiplierGain = isTie ? 1 : getMultiplier(currentCard, guess);
      const newMultiplier = isWin
        ? Math.floor(state.currentMultiplier * (isTie ? 1 : multiplierGain) * 100) / 100
        : state.currentMultiplier;
      const potentialWin = Math.floor(state.betAmount * newMultiplier);

      if (isWin) {
        // Update session with new state
        const newHistory = [...state.history, nextCard];
        await supabaseAdmin
          .from("game_sessions")
          .update({
            state: {
              ...state,
              deck: newDeck,
              currentCard: nextCard,
              streak: newStreak,
              currentMultiplier: newMultiplier,
              history: newHistory,
            },
          })
          .eq("session_id", sessionId);

        const higherMult = getMultiplier(nextCard, "higher");
        const lowerMult = getMultiplier(nextCard, "lower");

        return new Response(JSON.stringify({
          success: true,
          isWin: true,
          isTie,
          nextCard,
          streak: newStreak,
          currentMultiplier: newMultiplier,
          potentialWin,
          higherMultiplier: higherMult,
          lowerMultiplier: lowerMult,
          cardsRemaining: newDeck.length,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } else {
        // LOSS — end session
        await supabaseAdmin
          .from("game_sessions")
          .update({ is_active: false, ended_at: new Date().toISOString() })
          .eq("session_id", sessionId);

        return new Response(JSON.stringify({
          success: true,
          isWin: false,
          isTie: false,
          nextCard,
          streak: state.streak,
          currentMultiplier: state.currentMultiplier,
          potentialWin: 0,
          higherMultiplier: 0,
          lowerMultiplier: 0,
          cardsRemaining: newDeck.length,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

    } else if (action === "cashout") {
      // --- CASH OUT ---
      if (!sessionId) throw new Error("Missing sessionId");

      const { data: session } = await supabaseAdmin
        .from("game_sessions")
        .select("*")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!session) throw new Error("No active session");

      const state = session.state as any;
      const winAmount = Math.floor(state.betAmount * state.currentMultiplier);

      // End session + payout in parallel
      const [, , balData] = await Promise.all([
        supabaseAdmin
          .from("game_sessions")
          .update({ is_active: false, ended_at: new Date().toISOString() })
          .eq("session_id", sessionId),
        supabaseAdmin.from("shard_transactions").insert({
          user_id: user.id,
          amount: winAmount,
          type: "game_win",
          description: `Hi-Lo gevinst: x${state.currentMultiplier} (${state.streak} streak)`,
        }),
        supabaseAdmin
          .from("shard_balances")
          .select("balance")
          .eq("user_id", user.id)
          .single(),
      ]);

      // Update balance
      await supabaseAdmin
        .from("shard_balances")
        .update({ balance: (balData?.data?.balance || 0) + winAmount })
        .eq("user_id", user.id);

      return new Response(JSON.stringify({
        success: true,
        winAmount,
        multiplier: state.currentMultiplier,
        streak: state.streak,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } else {
      throw new Error("Invalid action");
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

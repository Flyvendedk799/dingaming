import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GameSession {
  mines: number[];
  revealed: number[];
  betAmount: number;
  currentMultiplier: number;
  cashedOut: boolean;
  hitMine: boolean;
}

// Calculate multiplier based on revealed tiles and mine count
function calculateMultiplier(revealed: number, mineCount: number): number {
  const totalTiles = 25;
  const safeTiles = totalTiles - mineCount;
  
  if (revealed === 0) return 1;
  
  // Calculate the probability-based multiplier
  let multiplier = 1;
  for (let i = 0; i < revealed; i++) {
    const remaining = totalTiles - i;
    const safeRemaining = safeTiles - i;
    multiplier *= remaining / safeRemaining;
  }
  
  // Apply house edge (3%)
  return Math.floor(multiplier * 0.97 * 100) / 100;
}

// Generate random mine positions
function generateMines(count: number): number[] {
  const positions: number[] = [];
  while (positions.length < count) {
    const pos = Math.floor(Math.random() * 25);
    if (!positions.includes(pos)) {
      positions.push(pos);
    }
  }
  return positions;
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

    const { action, mineCount, betAmount, tileIndex, sessionId } = await req.json();

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

    if (action === "start") {
      // Idempotency: if a mines game is already active, return it instead of charging again
      const { data: existingSession, error: existingSessionError } = await supabaseAdmin
        .from("game_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("game_type", "mines")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSessionError) {
        console.error("Error checking existing mines session:", existingSessionError);
      }

      if (existingSession) {
        const session = existingSession.state as GameSession;
        return new Response(
          JSON.stringify({
            success: true,
            restored: true,
            sessionId: existingSession.session_id,
            mineCount: session.mines.length,
            betAmount: session.betAmount,
            nextMultiplier: calculateMultiplier(session.revealed.length + 1, session.mines.length),
            state: session,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Start a new game
      if (!betAmount || betAmount < 10) {
        return new Response(
          JSON.stringify({ error: "Minimum bet is 10 shards" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (betAmount > currentBalance) {
        return new Response(
          JSON.stringify({ error: "Insufficient balance" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!mineCount || mineCount < 1 || mineCount > 24) {
        return new Response(
          JSON.stringify({ error: "Mine count must be between 1 and 24" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Deduct bet amount
      await supabaseAdmin
        .from("shard_balances")
        .update({
          balance: currentBalance - betAmount,
          lifetime_spent: (balanceData.lifetime_spent || 0) + betAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      // Record the bet transaction
      await supabaseAdmin.from("shard_transactions").insert({
        user_id: userId,
        amount: -betAmount,
        type: "game_bet",
        description: `Mines indsats (${mineCount} miner)`,
        reference_id: `mines_${Date.now()}`,
      });

      // Generate mines and create session
      const mines = generateMines(mineCount);
      const newSessionId = `${userId}_${Date.now()}`;

      const session: GameSession = {
        mines,
        revealed: [],
        betAmount,
        currentMultiplier: 1,
        cashedOut: false,
        hitMine: false,
      };

      // Store session in database for persistence
      await supabaseAdmin.from("game_sessions").insert({
        session_id: newSessionId,
        user_id: userId,
        game_type: "mines",
        state: session,
        created_at: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          success: true,
          sessionId: newSessionId,
          mineCount,
          betAmount,
          nextMultiplier: calculateMultiplier(1, mineCount),
          state: session,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reveal") {
      // Reveal a tile
      if (!sessionId || tileIndex === undefined) {
        return new Response(
          JSON.stringify({ error: "Missing sessionId or tileIndex" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get session from database
      const { data: sessionData, error: sessionError } = await supabaseAdmin
        .from("game_sessions")
        .select("*")
        .eq("session_id", sessionId)
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();

      if (sessionError || !sessionData) {
        return new Response(
          JSON.stringify({ error: "Game session not found or expired" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const session = sessionData.state as GameSession;

      if (session.cashedOut || session.hitMine) {
        return new Response(
          JSON.stringify({ error: "Game already ended" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (session.revealed.includes(tileIndex)) {
        return new Response(
          JSON.stringify({ error: "Tile already revealed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const hitMine = session.mines.includes(tileIndex);
      session.revealed.push(tileIndex);

      if (hitMine) {
        session.hitMine = true;
        
        // End game - player loses
        await supabaseAdmin
          .from("game_sessions")
          .update({ 
            state: session, 
            is_active: false,
            ended_at: new Date().toISOString(),
          })
          .eq("session_id", sessionId);

        return new Response(
          JSON.stringify({
            success: true,
            hitMine: true,
            mines: session.mines,
            revealed: session.revealed,
            winAmount: 0,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Calculate new multiplier
      session.currentMultiplier = calculateMultiplier(session.revealed.length, session.mines.length);
      const nextMultiplier = calculateMultiplier(session.revealed.length + 1, session.mines.length);
      
      // Check if all safe tiles revealed
      const safeTiles = 25 - session.mines.length;
      const autoWin = session.revealed.length >= safeTiles;

      if (autoWin) {
        // Player revealed all safe tiles!
        session.cashedOut = true;
        const winAmount = Math.floor(session.betAmount * session.currentMultiplier);

        // Update session
        await supabaseAdmin
          .from("game_sessions")
          .update({ 
            state: session, 
            is_active: false,
            ended_at: new Date().toISOString(),
          })
          .eq("session_id", sessionId);

        // Award winnings
        const { data: newBalance } = await supabaseAdmin
          .from("shard_balances")
          .select("balance, lifetime_earned")
          .eq("user_id", userId)
          .single();

        await supabaseAdmin
          .from("shard_balances")
          .update({
            balance: (newBalance?.balance || 0) + winAmount,
            lifetime_earned: (newBalance?.lifetime_earned || 0) + winAmount,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        await supabaseAdmin.from("shard_transactions").insert({
          user_id: userId,
          amount: winAmount,
          type: "game_win",
          description: `Mines gevinst (x${session.currentMultiplier})`,
          reference_id: sessionId,
        });

        return new Response(
          JSON.stringify({
            success: true,
            hitMine: false,
            revealed: session.revealed,
            currentMultiplier: session.currentMultiplier,
            autoWin: true,
            winAmount,
            mines: session.mines,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update session
      await supabaseAdmin
        .from("game_sessions")
        .update({ state: session })
        .eq("session_id", sessionId);

      return new Response(
        JSON.stringify({
          success: true,
          hitMine: false,
          revealed: session.revealed,
          currentMultiplier: session.currentMultiplier,
          nextMultiplier,
          potentialWin: Math.floor(session.betAmount * session.currentMultiplier),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "cashout") {
      // Cash out current winnings
      if (!sessionId) {
        return new Response(
          JSON.stringify({ error: "Missing sessionId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: sessionData, error: sessionError } = await supabaseAdmin
        .from("game_sessions")
        .select("*")
        .eq("session_id", sessionId)
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();

      if (sessionError || !sessionData) {
        return new Response(
          JSON.stringify({ error: "Game session not found" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const session = sessionData.state as GameSession;

      if (session.cashedOut || session.hitMine) {
        return new Response(
          JSON.stringify({ error: "Game already ended" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (session.revealed.length === 0) {
        return new Response(
          JSON.stringify({ error: "Must reveal at least one tile before cashing out" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      session.cashedOut = true;
      const winAmount = Math.floor(session.betAmount * session.currentMultiplier);

      // End session
      await supabaseAdmin
        .from("game_sessions")
        .update({ 
          state: session, 
          is_active: false,
          ended_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId);

      // Award winnings
      const { data: newBalance } = await supabaseAdmin
        .from("shard_balances")
        .select("balance, lifetime_earned")
        .eq("user_id", userId)
        .single();

      await supabaseAdmin
        .from("shard_balances")
        .update({
          balance: (newBalance?.balance || 0) + winAmount,
          lifetime_earned: (newBalance?.lifetime_earned || 0) + winAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      await supabaseAdmin.from("shard_transactions").insert({
        user_id: userId,
        amount: winAmount,
        type: "game_win",
        description: `Mines gevinst (x${session.currentMultiplier})`,
        reference_id: sessionId,
      });

      return new Response(
        JSON.stringify({
          success: true,
          cashedOut: true,
          winAmount,
          multiplier: session.currentMultiplier,
          mines: session.mines,
          revealed: session.revealed,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Play mines error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
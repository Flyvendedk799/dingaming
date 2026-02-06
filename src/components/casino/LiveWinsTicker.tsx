import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WinEvent {
  id: string;
  game_type: string;
  win_amount: number;
  multiplier: number;
  created_at: string;
  display_name?: string;
}

const LiveWinsTicker = () => {
  const { data: recentWins } = useQuery({
    queryKey: ["recent-wins"],
    queryFn: async () => {
      // Get recent winning game sessions
      const { data: sessions, error } = await supabase
        .from("game_sessions")
        .select("id, game_type, state, created_at, user_id")
        .eq("is_active", false)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Filter to only wins and map to display format
      const wins: WinEvent[] = [];

      for (const session of sessions || []) {
        const state = session.state as Record<string, unknown>;
        
        // Check for mines wins
        if (session.game_type === "mines" && state?.cashedOut && !state?.hitMine) {
          const betAmount = (state.betAmount as number) || 0;
          const multiplier = (state.currentMultiplier as number) || 1;
          const winAmount = Math.floor(betAmount * multiplier);
          
          if (winAmount > betAmount) {
            wins.push({
              id: session.id,
              game_type: "mines",
              win_amount: winAmount,
              multiplier,
              created_at: session.created_at,
            });
          }
        }

        // Check for dice wins
        if (session.game_type === "dice" && state?.isWin) {
          wins.push({
            id: session.id,
            game_type: "dice",
            win_amount: (state.winAmount as number) || 0,
            multiplier: (state.multiplier as number) || 1,
            created_at: session.created_at,
          });
        }
      }

      return wins.slice(0, 5);
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const formatShards = (shards: number) => {
    return new Intl.NumberFormat("da-DK").format(shards);
  };

  const getGameLabel = (type: string) => {
    switch (type) {
      case "mines":
        return "Mines";
      case "dice":
        return "Dice";
      default:
        return type;
    }
  };

  if (!recentWins || recentWins.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden bg-white/5 backdrop-blur-sm border-y border-white/10">
      <div className="flex items-center py-2.5 px-4">
        <div className="flex items-center gap-2 shrink-0 mr-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/20 border border-success/30">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Trophy className="w-3.5 h-3.5 text-success" />
            </motion.div>
            <span className="text-xs font-semibold text-success uppercase tracking-wide">
              Live
            </span>
          </div>
        </div>

        <motion.div
          className="flex items-center gap-6"
          animate={{ x: [0, -100 * (recentWins.length || 1)] }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <AnimatePresence mode="popLayout">
            {[...recentWins, ...recentWins].map((win, index) => (
              <motion.div
                key={`${win.id}-${index}`}
                className="flex items-center gap-2 shrink-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
                <span className="text-xs text-white/60">Anonym</span>
                <span className="text-xs text-white/40">vandt</span>
                <span className="text-sm font-bold text-success">
                  {formatShards(win.win_amount)}
                </span>
                <span className="text-xs text-white/40">på</span>
                <span className="text-xs text-white/80 font-medium">
                  {getGameLabel(win.game_type)}
                </span>
                <span className="text-xs text-primary font-semibold">
                  (x{win.multiplier.toFixed(2)})
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default LiveWinsTicker;

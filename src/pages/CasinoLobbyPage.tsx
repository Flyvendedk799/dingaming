import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bomb,
  Dice6,
  Package,
  AlertTriangle,
  Sparkles,
  Spade,
  CircleDot,
  ArrowUpDown,
  AlignJustify,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import CasinoBackground from "@/components/casino/CasinoBackground";
import GameRoomCard from "@/components/casino/GameRoomCard";
import LiveWinsTicker from "@/components/casino/LiveWinsTicker";
import CasinoBalance from "@/components/casino/CasinoBalance";

const CasinoLobbyPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <CasinoBackground variant="lobby" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header
          className="sticky top-0 z-50 backdrop-blur-xl bg-black/20 border-b border-white/10"
          style={{
            paddingTop: isMobile ? "env(safe-area-inset-top, 0px)" : undefined,
          }}
        >
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/club"
                className="flex items-center text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Tilbage</span>
              </Link>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h1 className="font-heading text-xl text-white">Casino</h1>
              </div>
            </div>

            <CasinoBalance />
          </div>
        </header>

        {/* Live Wins Ticker */}
        <LiveWinsTicker />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-4"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-white/80">
                Brug Shards • Vind Stort
              </span>
            </motion.div>

            <h2 className="font-heading text-3xl md:text-4xl text-white mb-3">
              Vælg Dit Spil
            </h2>
            <p className="text-white/50 max-w-md mx-auto">
              Spil med dine optjente Shards og prøv lykken. Alle gevinster
              tilføjes direkte til din balance.
            </p>
          </motion.div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <GameRoomCard
              title="Mines"
              description="Undgå minerne og find alle diamanter for maksimal gevinst"
              icon={Bomb}
              href="/club/casino/mines"
              gradient="linear-gradient(145deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 78, 59, 0.3) 100%)"
              iconColor="text-emerald-400"
              borderColor="border-emerald-500/30"
              badge="Populær"
              delay={0.1}
            />

            <GameRoomCard
              title="Dice"
              description="Forudsig om terningen lander over eller under dit måltal"
              icon={Dice6}
              href="/club/casino/dice"
              gradient="linear-gradient(145deg, rgba(59, 130, 246, 0.15) 0%, rgba(30, 58, 138, 0.3) 100%)"
              iconColor="text-blue-400"
              borderColor="border-blue-500/30"
              delay={0.2}
            />

            <GameRoomCard
              title="Blackjack"
              description="Slå dealeren med 21 – klassisk kortspil med 3:2 payout"
              icon={Spade}
              href="/club/casino/blackjack"
              gradient="linear-gradient(145deg, rgba(245, 158, 11, 0.15) 0%, rgba(120, 53, 15, 0.3) 100%)"
              iconColor="text-amber-400"
              borderColor="border-amber-500/30"
              badge="Nyt"
              delay={0.3}
            />

            <GameRoomCard
              title="Roulette"
              description="Placer chips og spin hjulet – europæisk roulette med 0-36"
              icon={CircleDot}
              href="/club/casino/roulette"
              gradient="linear-gradient(145deg, rgba(220, 38, 38, 0.15) 0%, rgba(127, 29, 29, 0.3) 100%)"
              iconColor="text-red-400"
              borderColor="border-red-500/30"
              delay={0.35}
            />

            <GameRoomCard
              title="Hi-Lo"
              description="Gæt om næste kort er højere eller lavere – byg din streak!"
              icon={ArrowUpDown}
              href="/club/casino/hilo"
              gradient="linear-gradient(145deg, rgba(139, 92, 246, 0.15) 0%, rgba(76, 29, 149, 0.3) 100%)"
              iconColor="text-violet-400"
              borderColor="border-violet-500/30"
              badge="Nyt"
              delay={0.4}
            />

            <GameRoomCard
              title="Lines"
              description="Spin op til 5 linjer og match 3 symboler – multiplier op til x50!"
              icon={AlignJustify}
              href="/club/casino/lines"
              gradient="linear-gradient(145deg, rgba(6, 182, 212, 0.15) 0%, rgba(8, 51, 68, 0.3) 100%)"
              iconColor="text-cyan-400"
              borderColor="border-cyan-500/30"
              badge="Nyt"
              delay={0.45}
            />

            <GameRoomCard
              title="Cases"
              description="Åbn mystery cases og vind rigtige spil til din samling"
              icon={Package}
              href="/club/cases"
              gradient="linear-gradient(145deg, rgba(168, 85, 247, 0.15) 0%, rgba(88, 28, 135, 0.3) 100%)"
              iconColor="text-purple-400"
              borderColor="border-purple-500/30"
              badge="Spil"
              delay={0.5}
            />
          </div>

          {/* Warning Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-10 max-w-2xl mx-auto"
          >
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white font-medium">
                  Spil ansvarligt
                </p>
                <p className="text-xs text-white/50 mt-1">
                  Dette er underholdning med virtuelle points. Shards har ingen
                  reel pengeværdi og kan ikke veksles til kontanter.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            <Link to="/club">
              <Button
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                Hent daglig bonus
              </Button>
            </Link>
            <Link to="/club/rewards">
              <Button
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                Brug Shards på rewards
              </Button>
            </Link>
            <Link to="/">
              <Button
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                Køb spil (1% cashback)
              </Button>
            </Link>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default CasinoLobbyPage;

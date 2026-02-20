import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import CasinoBackground from "@/components/casino/CasinoBackground";
import CasinoBalance from "@/components/casino/CasinoBalance";
import HiLoGame from "@/components/games/HiLoGame";

const HiLoRoomPage = () => {
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
      <CasinoBackground variant="hilo" />

      <div className="relative z-10">
        <header
          className="sticky top-0 z-50 backdrop-blur-xl bg-black/20 border-b border-white/10"
          style={{
            paddingTop: isMobile ? "env(safe-area-inset-top, 0px)" : undefined,
          }}
        >
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/club/casino"
                className="flex items-center text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Casino</span>
              </Link>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
                  <span className="text-white text-sm">🃏</span>
                </div>
                <h1 className="font-heading text-xl text-white">Hi-Lo</h1>
              </div>
            </div>

            <CasinoBalance />
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 md:py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto"
          >
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-white/50 text-sm">
                Gæt om næste kort er højere eller lavere. Byg din streak og udbetal når du vil!
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <HiLoGame />
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default HiLoRoomPage;

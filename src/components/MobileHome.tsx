import { motion } from "framer-motion";
import { ChevronRight, Zap, Star, Shield } from "lucide-react";
import game1 from "@/assets/game-1.jpg";
import game2 from "@/assets/game-2.jpg";
import game3 from "@/assets/game-3.jpg";
import game4 from "@/assets/game-4.jpg";
import game5 from "@/assets/game-5.jpg";
import game6 from "@/assets/game-6.jpg";
import MobileGameTile from "./MobileGameTile";
import { useState, useRef } from "react";

const games = [
  { id: 1, title: "Elden Ring", image: game1, price: 299, originalPrice: 449, platform: "Steam", discount: 33, rating: 4.9 },
  { id: 2, title: "Cyberpunk 2077", image: game2, price: 199, originalPrice: 399, platform: "GOG", discount: 50, rating: 4.7 },
  { id: 3, title: "God of War", image: game3, price: 349, originalPrice: 449, platform: "Steam", discount: 22, rating: 4.8 },
  { id: 4, title: "Hogwarts Legacy", image: game4, price: 279, originalPrice: 399, platform: "Steam", discount: 30, rating: 4.6 },
  { id: 5, title: "Red Dead 2", image: game5, price: 179, originalPrice: 399, platform: "Steam", discount: 55, rating: 4.9 },
  { id: 6, title: "Baldur's Gate 3", image: game6, price: 399, originalPrice: 449, platform: "Steam", discount: 11, rating: 5.0 },
];

interface MobileHomeProps {
  onSelectGame: (game: typeof games[0]) => void;
}

const MobileHome = ({ onSelectGame }: MobileHomeProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* iOS-style header */}
      <div 
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold">
                <span className="text-foreground">Din</span>
                <span className="text-success">Gaming</span>
              </h1>
              <p className="text-xs text-muted-foreground">Dit Gaming Univers</p>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-success/10 border border-success/20">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-2.5 h-2.5 text-accent fill-accent" />
                ))}
              </div>
              <span className="text-xs font-semibold text-success">4.9</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero banner */}
      <div className="px-4 py-4">
        <motion.div 
          className="relative rounded-2xl overflow-hidden h-40 bg-gradient-to-r from-success/20 to-success/5 border border-success/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute inset-0 p-4 flex flex-col justify-between">
            <div>
              <span className="px-2 py-1 rounded-md bg-destructive text-destructive-foreground text-xs font-bold">
                🔥 HOT DEAL
              </span>
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground mb-1">
                Spar op til 70%
              </h2>
              <p className="text-sm text-muted-foreground">På tusindvis af spil</p>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/2">
            <img src={game1} alt="" className="w-full h-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-r from-background to-transparent" />
          </div>
        </motion.div>
      </div>

      {/* Quick info */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-around py-3 rounded-xl bg-card border border-border/50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-success mb-0.5">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-bold">30 sek</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Levering</span>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-success mb-0.5">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-bold">100%</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Garanti</span>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-success mb-0.5">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-bold">50K+</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Kunder</span>
          </div>
        </div>
      </div>

      {/* Trending - Horizontal scroll */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="font-heading text-lg font-bold">Trending Nu 🔥</h2>
          <button className="flex items-center text-success text-sm font-medium">
            Se alle <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div 
          ref={scrollRef}
          className="flex gap-3 px-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {games.slice(0, 4).map((game, index) => (
            <motion.div
              key={game.id}
              className="flex-shrink-0 w-[160px] snap-start"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MobileGameTile {...game} onClick={() => onSelectGame(game)} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Best Deals - Grid */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg font-bold">Bedste Tilbud</h2>
          <button className="flex items-center text-success text-sm font-medium">
            Se alle <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <MobileGameTile {...game} onClick={() => onSelectGame(game)} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileHome;
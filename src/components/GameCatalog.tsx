import { motion } from "framer-motion";
import GameCard from "./GameCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Flame, TrendingUp, Sparkles, Filter } from "lucide-react";
import game1 from "@/assets/game-1.jpg";
import game2 from "@/assets/game-2.jpg";
import game3 from "@/assets/game-3.jpg";
import game4 from "@/assets/game-4.jpg";
import game5 from "@/assets/game-5.jpg";
import game6 from "@/assets/game-6.jpg";

const games = [
  { id: 1, title: "Shadow Warrior: Legends", image: game1, price: 299, originalPrice: 449, platform: "Steam", discount: 33, rating: 4.8 },
  { id: 2, title: "Galactic Warfare 2077", image: game2, price: 449, platform: "Steam", rating: 4.6 },
  { id: 3, title: "Midnight Racer X", image: game3, price: 349, originalPrice: 499, platform: "PlayStation", discount: 30, rating: 4.7 },
  { id: 4, title: "The Dark Within", image: game4, price: 199, platform: "Xbox", rating: 4.5 },
  { id: 5, title: "Pro Football 25", image: game5, price: 399, originalPrice: 549, platform: "PlayStation", discount: 27, rating: 4.4 },
  { id: 6, title: "Sky Adventures", image: game6, price: 249, platform: "Nintendo Switch", rating: 4.9 },
];

const categories = [
  { name: "Alle", icon: Sparkles, active: true },
  { name: "Trending", icon: TrendingUp },
  { name: "Tilbud", icon: Flame },
  { name: "Action" },
  { name: "Racing" },
  { name: "Sport" },
];

const GameCatalog = () => {
  return (
    <section id="spil" className="relative py-32 overflow-hidden bg-noise">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.08)_0%,_transparent_50%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-surface-2 to-transparent" />
      
      {/* Decorative grid */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
        backgroundSize: '100px 100px'
      }} />

      <div className="relative container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-destructive/30 mb-8"
          >
            <Flame className="w-4 h-4 text-destructive" />
            <span className="text-sm font-semibold text-destructive tracking-wide">POPULÆRE LIGE NU</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-[3rem] sm:text-[5rem] lg:text-[7rem] font-normal leading-[0.9] mb-8"
          >
            <span className="text-foreground">UDFORSK </span>
            <span className="text-gradient glow-text">VORES</span>
            <br />
            <span className="text-foreground">GAME KEYS</span>
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-4 mb-6"
          >
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-primary/50" />
            <Sparkles className="w-5 h-5 text-primary" />
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-primary/50" />
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-xl max-w-2xl mx-auto font-body"
          >
            Tusindvis af spil til alle platforme. Find dit næste eventyr og 
            modtag din key <span className="text-primary font-semibold">øjeblikkeligt</span>.
          </motion.p>
        </div>

        {/* Categories */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-3 mb-16"
        >
          {categories.map((category) => (
            <Button
              key={category.name}
              variant={category.active ? "hero" : "ghost"}
              size="lg"
              className={`rounded-full font-tech text-xs tracking-wider ${!category.active && 'border border-border hover:border-primary/50'}`}
            >
              {category.icon && <category.icon className="w-4 h-4 mr-2" />}
              {category.name.toUpperCase()}
            </Button>
          ))}
          <Button variant="outline" size="icon" className="rounded-full w-12 h-12">
            <Filter className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {games.map((game, index) => (
            <GameCard
              key={game.id}
              title={game.title}
              image={game.image}
              price={game.price}
              originalPrice={game.originalPrice}
              platform={game.platform}
              discount={game.discount}
              rating={game.rating}
              index={index}
            />
          ))}
        </div>

        {/* Load More */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button variant="outline" size="xl" className="group border-2 font-tech tracking-wider">
            SE ALLE SPIL
            <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-2" />
          </Button>
        </motion.div>

        {/* Decorative line */}
        <div className="mt-32 line-glow" />
      </div>
    </section>
  );
};

export default GameCatalog;

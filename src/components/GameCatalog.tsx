import GameCard from "./GameCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Flame, TrendingUp, Sparkles } from "lucide-react";
import game1 from "@/assets/game-1.jpg";
import game2 from "@/assets/game-2.jpg";
import game3 from "@/assets/game-3.jpg";
import game4 from "@/assets/game-4.jpg";
import game5 from "@/assets/game-5.jpg";
import game6 from "@/assets/game-6.jpg";

const games = [
  {
    id: 1,
    title: "Shadow Warrior: Legends",
    image: game1,
    price: 299,
    originalPrice: 449,
    platform: "Steam",
    discount: 33,
    rating: 4.8,
  },
  {
    id: 2,
    title: "Galactic Warfare 2077",
    image: game2,
    price: 449,
    platform: "Steam",
    rating: 4.6,
  },
  {
    id: 3,
    title: "Midnight Racer X",
    image: game3,
    price: 349,
    originalPrice: 499,
    platform: "PlayStation",
    discount: 30,
    rating: 4.7,
  },
  {
    id: 4,
    title: "The Dark Within",
    image: game4,
    price: 199,
    platform: "Xbox",
    rating: 4.5,
  },
  {
    id: 5,
    title: "Pro Football 25",
    image: game5,
    price: 399,
    originalPrice: 549,
    platform: "PlayStation",
    discount: 27,
    rating: 4.4,
  },
  {
    id: 6,
    title: "Sky Adventures",
    image: game6,
    price: 249,
    platform: "Nintendo Switch",
    rating: 4.9,
  },
];

const categories = [
  { name: "Alle", icon: Sparkles },
  { name: "Trending", icon: TrendingUp },
  { name: "På Tilbud", icon: Flame },
  { name: "Action", icon: null },
  { name: "Racing", icon: null },
  { name: "Sport", icon: null },
];

const GameCatalog = () => {
  return (
    <section id="spil" className="relative py-24 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

      <div className="relative container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 mb-6">
            <Flame className="w-4 h-4 text-destructive" />
            <span className="text-sm font-semibold text-muted-foreground">Populære lige nu</span>
          </div>
          
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Udforsk vores <span className="text-gradient glow-text">Game Keys</span>
          </h2>
          
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Tusindvis af spil til alle platforme. Find dit næste eventyr og 
            modtag din key <span className="text-primary font-semibold">øjeblikkeligt</span>.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
          {categories.map((category, index) => (
            <Button
              key={category.name}
              variant={index === 0 ? "hero" : "ghost"}
              size="lg"
              className={`rounded-full ${index === 0 ? '' : 'border border-border hover:border-primary/50'}`}
            >
              {category.icon && <category.icon className="w-4 h-4 mr-1" />}
              {category.name}
            </Button>
          ))}
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {games.map((game, index) => (
            <div
              key={game.id}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <GameCard
                title={game.title}
                image={game.image}
                price={game.price}
                originalPrice={game.originalPrice}
                platform={game.platform}
                discount={game.discount}
                rating={game.rating}
              />
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center">
          <Button variant="outline" size="xl" className="group">
            Se Alle Spil
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
          </Button>
        </div>

        {/* Decorative line */}
        <div className="mt-24 decoration-line" />
      </div>
    </section>
  );
};

export default GameCatalog;

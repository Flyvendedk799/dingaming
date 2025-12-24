import GameCard from "./GameCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Flame, Filter, ChevronDown } from "lucide-react";
import game1 from "@/assets/game-1.jpg";
import game2 from "@/assets/game-2.jpg";
import game3 from "@/assets/game-3.jpg";
import game4 from "@/assets/game-4.jpg";
import game5 from "@/assets/game-5.jpg";
import game6 from "@/assets/game-6.jpg";

const games = [
  { id: 1, title: "Shadow Warrior: Legends", image: game1, price: 299, originalPrice: 449, platform: "Steam", discount: 33, rating: 4.8, stock: 47, reviews: 2431 },
  { id: 2, title: "Galactic Warfare 2077", image: game2, price: 449, originalPrice: 599, platform: "Steam", discount: 25, rating: 4.6, stock: 234, reviews: 1876 },
  { id: 3, title: "Midnight Racer X", image: game3, price: 349, originalPrice: 499, platform: "PlayStation", discount: 30, rating: 4.7, stock: 89, reviews: 943 },
  { id: 4, title: "The Dark Within", image: game4, price: 199, originalPrice: 349, platform: "Xbox", discount: 43, rating: 4.5, stock: 23, reviews: 567 },
  { id: 5, title: "Pro Football 25", image: game5, price: 399, originalPrice: 549, platform: "PlayStation", discount: 27, rating: 4.4, stock: 156, reviews: 3241 },
  { id: 6, title: "Sky Adventures", image: game6, price: 249, originalPrice: 399, platform: "Nintendo Switch", discount: 38, rating: 4.9, stock: 178, reviews: 892 },
];

const GameCatalog = () => {
  return (
    <section id="spil" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header - Clear & Scannable */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-destructive" />
              <span className="text-sm font-semibold text-destructive uppercase tracking-wide">Populære lige nu</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
              Bedst sælgende spil
            </h2>
          </div>

          {/* Filters - Simple */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Platform
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              Pris
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              Sorter
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Products Grid - Clean layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {games.map((game) => (
            <GameCard
              key={game.id}
              title={game.title}
              image={game.image}
              price={game.price}
              originalPrice={game.originalPrice}
              platform={game.platform}
              discount={game.discount}
              rating={game.rating}
              stock={game.stock}
              reviews={game.reviews}
            />
          ))}
        </div>

        {/* Load More - Clear action */}
        <div className="text-center">
          <Button variant="outline" size="lg" className="font-semibold">
            Se alle 2.847 spil
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default GameCatalog;

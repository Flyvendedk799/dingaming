import GameCard from "./GameCard";
import { Button } from "@/components/ui/button";
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
  },
  {
    id: 2,
    title: "Galactic Warfare 2077",
    image: game2,
    price: 449,
    platform: "Steam",
  },
  {
    id: 3,
    title: "Midnight Racer X",
    image: game3,
    price: 349,
    originalPrice: 499,
    platform: "PlayStation",
    discount: 30,
  },
  {
    id: 4,
    title: "The Dark Within",
    image: game4,
    price: 199,
    platform: "Xbox",
  },
  {
    id: 5,
    title: "Pro Football 25",
    image: game5,
    price: 399,
    originalPrice: 549,
    platform: "PlayStation",
    discount: 27,
  },
  {
    id: 6,
    title: "Sky Adventures",
    image: game6,
    price: 249,
    platform: "Nintendo Switch",
  },
];

const categories = ["Alle", "Action", "Racing", "Sport", "Horror", "Eventyr"];

const GameCatalog = () => {
  return (
    <section id="spil" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Populære <span className="text-gradient">Game Keys</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Udforsk vores udvalg af de bedste spil til alle platforme. 
            Øjeblikkelig levering garanteret.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {categories.map((category, index) => (
            <Button
              key={category}
              variant={index === 0 ? "default" : "ghost"}
              size="sm"
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {games.map((game) => (
            <GameCard
              key={game.id}
              title={game.title}
              image={game.image}
              price={game.price}
              originalPrice={game.originalPrice}
              platform={game.platform}
              discount={game.discount}
            />
          ))}
        </div>

        {/* Load More */}
        <div className="text-center">
          <Button variant="outline" size="lg">
            Se Alle Spil
          </Button>
        </div>
      </div>
    </section>
  );
};

export default GameCatalog;

import { Button } from "@/components/ui/button";
import { ShoppingCart, Zap, Star } from "lucide-react";

interface GameCardProps {
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  platform: string;
  discount?: number;
  rating?: number;
}

const GameCard = ({ title, image, price, originalPrice, platform, discount, rating = 4.5 }: GameCardProps) => {
  return (
    <div className="group relative rounded-2xl overflow-hidden game-card-hover">
      {/* Glow background on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-secondary to-primary rounded-2xl opacity-0 group-hover:opacity-75 blur transition-all duration-500 group-hover:duration-200" />
      
      <div className="relative bg-card rounded-2xl overflow-hidden border border-border/50">
        {/* Discount Badge */}
        {discount && (
          <div className="absolute top-4 left-4 z-20">
            <div className="relative">
              <div className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-bold shadow-lg">
                -{discount}%
              </div>
              <div className="absolute inset-0 bg-destructive/50 blur-md -z-10" />
            </div>
          </div>
        )}

        {/* Instant Delivery Badge */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-primary/30 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-primary">Instant</span>
        </div>

        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover card-image transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Quick buy overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <Button variant="hero" size="lg" className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <ShoppingCart className="w-5 h-5" />
              Tilføj til kurv
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-5 bg-gradient-to-t from-card to-transparent -mt-20 pt-24">
          {/* Platform & Rating */}
          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
              {platform}
            </span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-accent fill-accent" />
              <span className="text-sm font-semibold text-foreground">{rating}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-display text-lg font-bold text-foreground mb-4 line-clamp-2 leading-tight group-hover:text-gradient transition-all duration-300">
            {title}
          </h3>

          {/* Price & Action */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary glow-text">{price} kr</span>
              </div>
              {originalPrice && (
                <span className="text-sm text-muted-foreground line-through">{originalPrice} kr</span>
              )}
            </div>
            <Button variant="neon" size="icon" className="w-12 h-12 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
      </div>
    </div>
  );
};

export default GameCard;

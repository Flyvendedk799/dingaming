import { Button } from "@/components/ui/button";
import { ShoppingCart, Zap } from "lucide-react";

interface GameCardProps {
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  platform: string;
  discount?: number;
}

const GameCard = ({ title, image, price, originalPrice, platform, discount }: GameCardProps) => {
  return (
    <div className="group relative bg-card rounded-xl overflow-hidden border border-border game-card-hover shadow-card">
      {/* Discount Badge */}
      {discount && (
        <div className="absolute top-3 left-3 z-20 px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-sm font-bold">
          -{discount}%
        </div>
      )}

      {/* Instant Delivery Badge */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium">
        <Zap className="w-3 h-3" />
        Instant
      </div>

      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Platform */}
        <div className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">
          {platform}
        </div>

        {/* Title */}
        <h3 className="font-display text-lg font-bold text-foreground mb-3 line-clamp-2 leading-tight">
          {title}
        </h3>

        {/* Price & Action */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">{price} kr</span>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through">{originalPrice} kr</span>
            )}
          </div>
          <Button variant="neon" size="icon">
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameCard;

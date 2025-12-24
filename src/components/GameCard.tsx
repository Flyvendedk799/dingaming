import { Button } from "@/components/ui/button";
import { ShoppingCart, Zap, Star, Clock, CheckCircle2 } from "lucide-react";

interface GameCardProps {
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  platform: string;
  discount?: number;
  rating?: number;
  stock?: number;
  reviews?: number;
}

const GameCard = ({ 
  title, 
  image, 
  price, 
  originalPrice, 
  platform, 
  discount, 
  rating = 4.5,
  stock = 156,
  reviews = 234
}: GameCardProps) => {
  const lowStock = stock < 50;

  return (
    <div className="group bg-card rounded-xl border border-border overflow-hidden hover-lift shadow-soft">
      {/* Image container */}
      <div className="relative">
        <img
          src={image}
          alt={title}
          className="w-full aspect-[4/5] object-cover"
        />
        
        {/* Discount badge - prominent */}
        {discount && (
          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-bold">
            -{discount}%
          </div>
        )}

        {/* Platform badge */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-background/90 backdrop-blur-sm text-xs font-medium text-foreground">
          {platform}
        </div>

        {/* Quick delivery indicator */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-success/90 text-success-foreground text-xs font-medium">
            <Zap className="w-3.5 h-3.5" />
            Levering på 30 sekunder
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Rating - social proof */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-accent fill-accent" />
            <span className="text-sm font-medium text-foreground">{rating}</span>
          </div>
          <span className="text-xs text-muted-foreground">({reviews} anmeldelser)</span>
        </div>

        {/* Title - readable */}
        <h3 className="font-heading text-lg font-semibold text-foreground mb-3 line-clamp-2">
          {title}
        </h3>

        {/* Price block - HERO of the card */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-success">{price} kr</span>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through">{originalPrice} kr</span>
            )}
          </div>
          {originalPrice && (
            <span className="text-xs font-medium text-destructive">
              Spar {originalPrice - price} kr
            </span>
          )}
        </div>

        {/* Stock urgency */}
        {lowStock && (
          <div className="flex items-center gap-1.5 mb-4 text-xs text-destructive">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-medium">Kun {stock} tilbage på lager</span>
          </div>
        )}

        {/* Single clear CTA */}
        <Button className="w-full font-semibold" size="lg">
          <ShoppingCart className="w-4 h-4" />
          Tilføj til kurv
        </Button>

        {/* Trust micro-copy */}
        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground">
          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          <span>Officiel key med garanti</span>
        </div>
      </div>
    </div>
  );
};

export default GameCard;

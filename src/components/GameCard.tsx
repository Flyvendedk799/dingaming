import { Button } from "@/components/ui/button";
import { ShoppingCart, Zap, Star, Clock, CheckCircle2, Heart } from "lucide-react";
import { useState } from "react";

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
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const lowStock = stock < 50;

  const handleAddToCart = () => {
    setIsAdding(true);
    setTimeout(() => setIsAdding(false), 1500);
  };

  return (
    <div className="game-card group">
      {/* Image container */}
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className="game-card-image w-full aspect-[4/5] object-cover"
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Discount badge */}
        {discount && (
          <div className="absolute top-3 left-3 px-2.5 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-bold shadow-lg">
            -{discount}%
          </div>
        )}

        {/* Platform badge */}
        <div className="absolute top-3 right-3 px-2.5 py-1.5 rounded-lg bg-background/95 backdrop-blur-sm text-xs font-semibold text-foreground shadow-sm">
          {platform}
        </div>

        {/* Wishlist button */}
        <button 
          onClick={() => setIsWishlisted(!isWishlisted)}
          className={`absolute top-14 right-3 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
            isWishlisted 
              ? 'bg-destructive text-destructive-foreground' 
              : 'bg-background/95 backdrop-blur-sm text-muted-foreground hover:text-destructive'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Quick delivery badge */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-success text-success-foreground text-xs font-semibold shadow-lg">
            <Zap className="w-3.5 h-3.5" />
            Levering på 30 sekunder
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Rating */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? 'text-accent fill-accent' : 'text-muted'}`} 
                />
              ))}
            </div>
            <span className="text-sm font-medium text-foreground">{rating}</span>
          </div>
          <span className="text-xs text-muted-foreground">({reviews.toLocaleString()})</span>
        </div>

        {/* Title */}
        <h3 className="font-heading text-lg font-semibold text-foreground mb-3 line-clamp-2 leading-snug group-hover:text-success transition-colors">
          {title}
        </h3>

        {/* Price */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-success">{price} kr</span>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through">{originalPrice} kr</span>
            )}
          </div>
          {originalPrice && (
            <span className="text-xs font-semibold text-destructive">
              Spar {originalPrice - price} kr
            </span>
          )}
        </div>

        {/* Stock urgency */}
        {lowStock && (
          <div className="flex items-center gap-1.5 mb-3">
            <Clock className="w-3.5 h-3.5 text-destructive" />
            <span className="text-xs font-medium text-destructive">Kun {stock} tilbage</span>
          </div>
        )}

        {/* CTA */}
        <Button 
          variant="success" 
          className="w-full font-semibold group/btn" 
          size="lg"
          onClick={handleAddToCart}
          disabled={isAdding}
        >
          {isAdding ? (
            <>
              <CheckCircle2 className="w-4 h-4 animate-scale-in" />
              Tilføjet!
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
              Tilføj til kurv
            </>
          )}
        </Button>

        {/* Trust */}
        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground">
          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          <span>Officiel key med garanti</span>
        </div>
      </div>
    </div>
  );
};

export default GameCard;

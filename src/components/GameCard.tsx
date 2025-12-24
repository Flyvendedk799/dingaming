import { Button } from "@/components/ui/button";
import { ShoppingCart, Zap, Star, Clock, CheckCircle2, Heart } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

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
  index?: number;
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
  reviews = 234,
  index = 0
}: GameCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const lowStock = stock < 50;

  const handleAddToCart = () => {
    setIsAdding(true);
    setTimeout(() => setIsAdding(false), 1500);
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  return (
    <motion.div 
      className="game-card group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ 
        duration: 0.4, 
        delay: Math.min(index * 0.05, 0.2),
        ease: "easeOut"
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Image container */}
      <div className="relative overflow-hidden">
        <motion.img
          src={image}
          alt={title}
          className="game-card-image w-full aspect-[4/5] object-cover will-change-transform"
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
        
        {/* Overlay gradient */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Discount badge with attention animation */}
        {discount && (
          <div className="absolute top-3 left-3 px-2.5 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-bold shadow-lg">
            -{discount}%
          </div>
        )}

        {/* Platform badge */}
        <motion.div 
          className="absolute top-3 right-3 px-2.5 py-1.5 rounded-lg bg-background/95 backdrop-blur-sm text-xs font-semibold text-foreground shadow-sm"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 + index * 0.1 }}
        >
          {platform}
        </motion.div>

        {/* Wishlist button with heart pop */}
        <motion.button 
          onClick={handleWishlist}
          className={`absolute top-14 right-3 w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-200 ${
            isWishlisted 
              ? 'bg-destructive text-destructive-foreground' 
              : 'bg-background/95 backdrop-blur-sm text-muted-foreground hover:text-destructive'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div
            animate={isWishlisted ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.4, ease: [0.17, 0.89, 0.32, 1.49] }}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </motion.div>
        </motion.button>

        {/* Quick delivery badge */}
        <motion.div 
          className="absolute bottom-3 left-3 right-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium shadow-lg">
            <Zap className="w-3.5 h-3.5" />
            Levering på 30 sekunder
          </div>
        </motion.div>
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
        <h3 className="font-heading text-lg font-semibold text-foreground mb-3 line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-300">
          {title}
        </h3>

        {/* Price */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              {price} kr
            </span>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through">{originalPrice} kr</span>
            )}
          </div>
          {originalPrice && (
            <span className="text-xs font-semibold text-destructive inline-block">
              Spar {originalPrice - price} kr
            </span>
          )}
        </div>

        {/* Stock urgency */}
        {lowStock && (
          <div className="flex items-center gap-1.5 mb-3">
            <Clock className="w-3.5 h-3.5 text-destructive" />
            <span className="text-xs font-medium text-destructive">
              Kun {stock} tilbage
            </span>
          </div>
        )}

        {/* CTA */}
        <Button 
          className="w-full font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          size="lg"
          onClick={handleAddToCart}
          disabled={isAdding}
        >
          {isAdding ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Tilføjet!
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Tilføj til kurv
            </span>
          )}
        </Button>

        {/* Trust */}
        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          <span>Officiel key med garanti</span>
        </div>
      </div>
    </motion.div>
  );
};

export default GameCard;
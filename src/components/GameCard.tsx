import { Button } from "@/components/ui/button";
import { ShoppingCart, Zap, Star, Clock, CheckCircle2, Heart, Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [showSuccess, setShowSuccess] = useState(false);
  const lowStock = stock < 50;

  const handleAddToCart = () => {
    setIsAdding(true);
    setShowSuccess(true);
    setTimeout(() => {
      setIsAdding(false);
      setTimeout(() => setShowSuccess(false), 2000);
    }, 600);
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  return (
    <motion.div 
      className="game-card group relative"
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
      {/* Glow effect on hover */}
      <motion.div
        className="absolute -inset-px rounded-xl bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 opacity-0 blur-sm"
        animate={{ opacity: isHovered ? 0.5 : 0 }}
        transition={{ duration: 0.3 }}
      />

      <div className="relative bg-card rounded-xl overflow-hidden border border-border">
        {/* Image container */}
        <div className="relative overflow-hidden">
          <motion.img
            src={image}
            alt={title}
            className="game-card-image w-full aspect-[4/5] object-cover will-change-transform"
            animate={{ scale: isHovered ? 1.08 : 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          
          {/* Overlay gradient */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: isHovered ? 0.8 : 0.5 }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Discount badge with pulse */}
          {discount && (
            <motion.div 
              className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold shadow-lg"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                -{discount}%
              </motion.span>
            </motion.div>
          )}

          {/* Platform badge */}
          <motion.div 
            className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-background/95 backdrop-blur-md text-xs font-semibold text-foreground shadow-md border border-border/50"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + index * 0.05 }}
          >
            {platform}
          </motion.div>

          {/* Wishlist button */}
          <motion.button 
            onClick={handleWishlist}
            className={`absolute top-14 right-3 w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-colors duration-200 ${
              isWishlisted 
                ? 'bg-destructive text-destructive-foreground' 
                : 'bg-background/95 backdrop-blur-md text-muted-foreground hover:text-destructive border border-border/50'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              animate={isWishlisted ? { scale: [1, 1.4, 1] } : {}}
              transition={{ duration: 0.4, ease: [0.17, 0.89, 0.32, 1.49] }}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </motion.div>
          </motion.button>

          {/* Quick delivery badge on hover */}
          <motion.div 
            className="absolute bottom-3 left-3 right-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-lg backdrop-blur-sm">
              <Zap className="w-4 h-4" />
              <span>Levering på 30 sekunder</span>
              <Sparkles className="w-3 h-3 ml-auto" />
            </div>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Rating with animation */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  >
                    <Star 
                      className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? 'text-primary fill-primary' : 'text-muted'}`} 
                    />
                  </motion.div>
                ))}
              </div>
              <span className="text-sm font-semibold text-foreground">{rating}</span>
            </div>
            <span className="text-xs text-muted-foreground">({reviews.toLocaleString()} anm.)</span>
          </div>

          {/* Title */}
          <h3 className="font-heading text-lg font-semibold text-foreground mb-3 line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>

          {/* Price */}
          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <motion.span 
                className="text-2xl font-bold text-primary"
                animate={isHovered ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {price} kr
              </motion.span>
              {originalPrice && (
                <span className="text-sm text-muted-foreground line-through">{originalPrice} kr</span>
              )}
            </div>
            {originalPrice && (
              <motion.div 
                className="flex items-center gap-1.5 mt-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <TrendingUp className="w-3.5 h-3.5 text-success" />
                <span className="text-xs font-semibold text-success">
                  Spar {originalPrice - price} kr
                </span>
              </motion.div>
            )}
          </div>

          {/* Stock urgency */}
          <AnimatePresence>
            {lowStock && (
              <motion.div 
                className="flex items-center gap-1.5 mb-3 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Clock className="w-3.5 h-3.5 text-destructive" />
                <span className="text-xs font-medium text-destructive">
                  Kun {stock} tilbage - skyndt dig!
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              className={`w-full font-semibold transition-all duration-300 ${
                showSuccess 
                  ? 'bg-success hover:bg-success text-success-foreground' 
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
              size="lg"
              onClick={handleAddToCart}
              disabled={isAdding}
            >
              <AnimatePresence mode="wait">
                {showSuccess ? (
                  <motion.span 
                    key="success"
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Tilføjet!
                  </motion.span>
                ) : (
                  <motion.span 
                    key="add"
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Tilføj til kurv
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>Officiel key</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>Instant levering</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GameCard;
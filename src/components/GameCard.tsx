import { Button } from "@/components/ui/button";
import { ShoppingCart, Zap, Star, Clock, CheckCircle2, Heart } from "lucide-react";
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
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1]
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Image container */}
      <div className="relative overflow-hidden">
        <motion.img
          src={image}
          alt={title}
          className="game-card-image w-full aspect-[4/5] object-cover"
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
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
          <motion.div 
            className="absolute top-3 left-3 px-2.5 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-bold shadow-lg"
            initial={{ scale: 0, rotate: -15 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + index * 0.1, type: "spring", stiffness: 400 }}
            whileHover={{ scale: 1.1, rotate: -3 }}
          >
            -{discount}%
          </motion.div>
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
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                >
                  <Star 
                    className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? 'text-accent fill-accent' : 'text-muted'}`} 
                  />
                </motion.div>
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

        {/* Price with pop animation */}
        <motion.div 
          className="mb-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="flex items-baseline gap-2">
            <motion.span 
              className="text-2xl font-bold text-primary"
              whileInView={{ scale: [0.9, 1.05, 1] }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              {price} kr
            </motion.span>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through">{originalPrice} kr</span>
            )}
          </div>
          {originalPrice && (
            <motion.span 
              className="text-xs font-semibold text-destructive inline-block"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              Spar {originalPrice - price} kr
            </motion.span>
          )}
        </motion.div>

        {/* Stock urgency with animated bar */}
        <AnimatePresence>
          {lowStock && (
            <motion.div 
              className="flex items-center gap-1.5 mb-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Clock className="w-3.5 h-3.5 text-destructive" />
              </motion.div>
              <motion.span 
                className="text-xs font-medium text-destructive"
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Kun {stock} tilbage
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA with success animation */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            className="w-full font-medium bg-primary text-primary-foreground hover:bg-primary/90"
            size="lg"
            onClick={handleAddToCart}
            disabled={isAdding}
          >
            <AnimatePresence mode="wait">
              {isAdding ? (
                <motion.div
                  key="added"
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </motion.div>
                  Tilføjet!
                </motion.div>
              ) : (
                <motion.div
                  key="add"
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ShoppingCart className="w-4 h-4 transition-transform group-hover/btn:scale-110 group-hover/btn:rotate-[-10deg]" />
                  Tilføj til kurv
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>

        {/* Trust */}
        <motion.div 
          className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          <span>Officiel key med garanti</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default GameCard;
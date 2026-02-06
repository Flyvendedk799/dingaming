import { Star, ShoppingCart, Sparkles } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileGameTileProps {
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  platform: string;
  discount?: number;
  rating?: number;
  onClick: () => void;
}

const MobileGameTile = ({
  title,
  image,
  price,
  originalPrice,
  platform,
  discount,
  rating = 4.5,
  onClick,
}: MobileGameTileProps) => {
  const addItem = useCartStore(state => state.addItem);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);

  const handleAddToCart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Create ripple effect
    const button = e.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const x = 'touches' in e 
      ? e.touches[0].clientX - rect.left 
      : (e as React.MouseEvent).clientX - rect.left;
    const y = 'touches' in e 
      ? e.touches[0].clientY - rect.top 
      : (e as React.MouseEvent).clientY - rect.top;
    setRipple({ x, y });
    setTimeout(() => setRipple(null), 500);
    
    setShowSuccess(true);
    addItem({
      variantId: `${title}-${platform}`,
      title,
      quantity: 1,
      price: {
        amount: price.toString(),
        currencyCode: 'DKK',
      },
      image,
      sku: platform,
    });
    toast.success('Tilføjet til kurv', {
      description: title,
    });
    setTimeout(() => setShowSuccess(false), 1500);
  }, [addItem, title, platform, price, image]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPressed(true);
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPressed(false);
    if (!touchStartRef.current) return;
    
    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const deltaTime = Date.now() - touchStartRef.current.time;
    
    if (deltaX < 10 && deltaY < 10 && deltaTime < 300) {
      onClick();
    }
    
    touchStartRef.current = null;
  };

  const handleClick = () => {
    onClick();
  };

  const hasDiscount = discount !== undefined && discount > 0;
  const hasBigDiscount = discount !== undefined && discount >= 40;

  return (
    <motion.div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full bg-card/80 backdrop-blur-sm rounded-3xl overflow-hidden border border-border/30 text-left cursor-pointer transition-all duration-200"
      style={{ touchAction: 'manipulation' }}
      animate={{ 
        scale: isPressed ? 0.97 : 1,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      whileHover={{ y: -4 }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <motion.img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover"
          animate={{ scale: isPressed ? 1.05 : 1 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card/60 via-transparent to-transparent" />
        
        {hasDiscount && (
          <motion.div 
            className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold shadow-sm flex items-center gap-1"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            -{discount}%
            {hasBigDiscount && (
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Sparkles className="w-3 h-3" />
              </motion.div>
            )}
          </motion.div>
        )}
        
        <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-background/80 backdrop-blur-md text-[10px] font-semibold shadow-sm">
          {platform}
        </div>

        {/* Quick add button with ripple */}
        <motion.button
          className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-2xl bg-success flex items-center justify-center shadow-glow overflow-hidden"
          onClick={handleAddToCart}
          onTouchEnd={(e) => {
            e.stopPropagation();
            handleAddToCart(e);
          }}
          style={{ touchAction: 'manipulation' }}
          whileTap={{ scale: 0.9 }}
          animate={showSuccess ? { scale: [1, 1.2, 1] } : {}}
        >
          {/* Ripple effect */}
          <AnimatePresence>
            {ripple && (
              <motion.span
                className="absolute bg-white/30 rounded-full"
                style={{
                  left: ripple.x,
                  top: ripple.y,
                  width: 10,
                  height: 10,
                  marginLeft: -5,
                  marginTop: -5,
                }}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </AnimatePresence>
          <ShoppingCart className="w-4 h-4 text-success-foreground relative z-10" />
        </motion.button>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Rating */}
        <div className="flex items-center gap-1 mb-1">
          <Star className="w-3 h-3 text-accent fill-accent" />
          <span className="text-xs font-medium">{rating.toFixed(1)}</span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm line-clamp-1 mb-1">{title}</h3>

        {/* Price with animation */}
        <div className="flex items-center gap-2">
          <motion.span 
            className="text-lg font-bold text-success"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            key={price}
          >
            {Math.round(price)} kr
          </motion.span>
          {originalPrice && originalPrice > price && (
            <span className="text-xs text-muted-foreground line-through">{Math.round(originalPrice)} kr</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MobileGameTile;

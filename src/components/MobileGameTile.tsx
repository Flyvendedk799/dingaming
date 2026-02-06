import { Star, ShoppingCart, Sparkles } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { forwardRef, useRef, useState, useCallback } from "react";
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

const MobileGameTile = forwardRef<HTMLDivElement, MobileGameTileProps>(({
  title,
  image,
  price,
  originalPrice,
  platform,
  discount,
  rating = 4.5,
  onClick,
}, ref) => {
  const addItem = useCartStore(state => state.addItem);
  const pointerStartRef = useRef<{ x: number; y: number; time: number; pointerId: number } | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const wasHandledRef = useRef(false);

  const handleAddToCart = useCallback((e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Create ripple effect
    const button = e.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    let x: number, y: number;
    
    if ('clientX' in e) {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    } else if ('touches' in e && e.touches.length > 0) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = rect.width / 2;
      y = rect.height / 2;
    }
    
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

  // Pointer events for reliable tap detection across all devices
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Ignore if it's on a button (add-to-cart)
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    
    setIsPressed(true);
    wasHandledRef.current = false;
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
      pointerId: e.pointerId,
    };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    if (e.pointerId !== pointerStartRef.current.pointerId) return;
    
    const deltaX = Math.abs(e.clientX - pointerStartRef.current.x);
    const deltaY = Math.abs(e.clientY - pointerStartRef.current.y);
    
    // If moved too much, cancel the tap (user is scrolling)
    if (deltaX > 15 || deltaY > 15) {
      pointerStartRef.current = null;
      setIsPressed(false);
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsPressed(false);
    
    // If tapping on a button, let it handle itself
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      pointerStartRef.current = null;
      return;
    }
    
    if (!pointerStartRef.current) return;
    if (e.pointerId !== pointerStartRef.current.pointerId) return;
    
    const deltaX = Math.abs(e.clientX - pointerStartRef.current.x);
    const deltaY = Math.abs(e.clientY - pointerStartRef.current.y);
    const deltaTime = Date.now() - pointerStartRef.current.time;
    
    // Valid tap: small movement, quick duration
    if (deltaX < 15 && deltaY < 15 && deltaTime < 500) {
      wasHandledRef.current = true;
      console.log('[DEBUG] MobileGameTile pointerUp -> calling onClick');
      onClick();
    }
    
    pointerStartRef.current = null;
  }, [onClick]);

  const handlePointerCancel = useCallback(() => {
    console.log('[DEBUG] MobileGameTile pointerCancel');
    setIsPressed(false);
    pointerStartRef.current = null;
  }, []);

  // Fallback click for keyboard/mouse accessibility and edge cases
  const handleClick = useCallback((e: React.MouseEvent) => {
    // If pointer events already handled this, skip
    if (wasHandledRef.current) {
      wasHandledRef.current = false;
      return;
    }
    
    // If clicking on a button, let it handle itself
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    
    console.log('[DEBUG] MobileGameTile click fallback -> calling onClick');
    onClick();
  }, [onClick]);

  const hasDiscount = discount !== undefined && discount > 0;
  const hasBigDiscount = discount !== undefined && discount >= 40;

  // Check if device supports hover (desktop)
  const supportsHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

  return (
    <motion.div
      ref={ref}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className="w-full bg-card/80 backdrop-blur-sm rounded-3xl overflow-hidden border border-border/30 text-left cursor-pointer transition-all duration-200"
      style={{ touchAction: 'manipulation' }}
      animate={{ 
        scale: isPressed ? 0.97 : 1,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      whileHover={supportsHover ? { y: -4 } : undefined}
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

        {/* Quick add button */}
        <motion.button
          className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-2xl bg-success flex items-center justify-center shadow-glow overflow-hidden"
          onClick={handleAddToCart}
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
});

MobileGameTile.displayName = "MobileGameTile";

export default MobileGameTile;

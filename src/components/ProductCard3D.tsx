import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Zap, Star, Heart, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedPrice from "./AnimatedPrice";
import { cn } from "@/lib/utils";

interface ProductCard3DProps {
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  platform: string;
  discount?: number;
  rating?: number;
  reviews?: number;
  index?: number;
  onClick?: () => void;
  onAddToCart?: () => void;
}

const ProductCard3D = ({
  title,
  image,
  price,
  originalPrice,
  platform,
  discount,
  rating = 4.5,
  reviews = 234,
  index = 0,
  onClick,
  onAddToCart,
}: ProductCard3DProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [shinePosition, setShinePosition] = useState({ x: 50, y: 50 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Calculate rotation (max 8 degrees)
    const rotateYValue = (mouseX / (rect.width / 2)) * 8;
    const rotateXValue = -(mouseY / (rect.height / 2)) * 8;
    
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
    
    // Calculate shine position (0-100%)
    const shineX = ((e.clientX - rect.left) / rect.width) * 100;
    const shineY = ((e.clientY - rect.top) / rect.height) * 100;
    setShinePosition({ x: shineX, y: shineY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setShinePosition({ x: 50, y: 50 });
  }, []);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSuccess(true);
    onAddToCart?.();
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <motion.div
      ref={cardRef}
      className="group relative cursor-pointer"
      style={{ perspective: "1000px" }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.5,
        delay: Math.min(index * 0.06, 0.3),
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <motion.div
        className="relative bg-card rounded-2xl overflow-hidden border border-border transition-colors duration-300"
        style={{
          transformStyle: "preserve-3d",
        }}
        animate={{
          rotateX: isHovered ? rotateX : 0,
          rotateY: isHovered ? rotateY : 0,
          scale: isHovered ? 1.02 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Glow effect */}
        <motion.div
          className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40 blur-xl opacity-0 -z-10"
          animate={{ opacity: isHovered ? 0.6 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Dynamic shine layer */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: `radial-gradient(circle at ${shinePosition.x}% ${shinePosition.y}%, rgba(255,255,255,0.15) 0%, transparent 50%)`,
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />

        {/* Image container with parallax */}
        <div className="relative overflow-hidden">
          <motion.img
            src={image}
            alt={title}
            className="w-full aspect-[4/5] object-cover"
            style={{ transformStyle: "preserve-3d" }}
            animate={{
              scale: isHovered ? 1.1 : 1,
              x: isHovered ? -rotateY * 0.5 : 0,
              y: isHovered ? rotateX * 0.5 : 0,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          />

          {/* Overlay gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent"
            animate={{ opacity: isHovered ? 0.9 : 0.6 }}
          />

          {/* Discount badge */}
          {discount && (
            <motion.div
              className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold shadow-lg"
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              style={{ transform: "translateZ(20px)" }}
            >
              <motion.span
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                -{discount}%
              </motion.span>
            </motion.div>
          )}

          {/* Platform badge */}
          <motion.div
            className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-background/95 backdrop-blur-md text-xs font-semibold shadow-md border border-border/50"
            style={{ transform: "translateZ(15px)" }}
          >
            {platform}
          </motion.div>

          {/* Wishlist button */}
          <motion.button
            onClick={handleWishlist}
            className={cn(
              "absolute top-14 right-3 w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-colors",
              isWishlisted
                ? "bg-destructive text-destructive-foreground"
                : "bg-background/95 backdrop-blur-md text-muted-foreground hover:text-destructive border border-border/50"
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{ transform: "translateZ(25px)" }}
          >
            <motion.div
              animate={isWishlisted ? { scale: [1, 1.4, 1] } : {}}
              transition={{ duration: 0.4, ease: [0.17, 0.89, 0.32, 1.49] }}
            >
              <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
            </motion.div>
          </motion.button>

          {/* Quick delivery badge on hover */}
          <motion.div
            className="absolute bottom-3 left-3 right-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.2 }}
            style={{ transform: "translateZ(30px)" }}
          >
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-lg">
              <Zap className="w-4 h-4" />
              <span>Levering på 30 sekunder</span>
              <Sparkles className="w-3 h-3 ml-auto" />
            </div>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-4" style={{ transform: "translateZ(10px)" }}>
          {/* Rating */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3.5 h-3.5",
                      i < Math.floor(rating)
                        ? "text-primary fill-primary"
                        : "text-muted"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold">{rating}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              ({reviews.toLocaleString()} anm.)
            </span>
          </div>

          {/* Title */}
          <h3 className="font-heading text-lg font-semibold line-clamp-2 leading-snug mb-3 group-hover:text-primary transition-colors">
            {title}
          </h3>

          {/* Animated Price */}
          <AnimatedPrice
            price={price}
            originalPrice={originalPrice}
            size="md"
            className="mb-4"
          />

          {/* CTA Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              className={cn(
                "w-full font-semibold transition-all duration-300",
                showSuccess
                  ? "bg-success hover:bg-success text-success-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              size="lg"
              onClick={handleAddToCart}
            >
              {showSuccess ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Tilføjet!
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Tilføj til kurv
                </span>
              )}
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
      </motion.div>
    </motion.div>
  );
};

export default ProductCard3D;

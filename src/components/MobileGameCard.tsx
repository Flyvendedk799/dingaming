import { forwardRef, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ChevronLeft, Heart, Share, Star, Zap, Shield, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

interface MobileGameCardProps {
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  platform: string;
  discount?: number;
  rating?: number;
  reviews?: number;
  onClose: () => void;
}

const MobileGameCard = forwardRef<HTMLDivElement, MobileGameCardProps>(({
  title,
  image,
  price,
  originalPrice,
  platform,
  discount,
  rating = 4.5,
  reviews = 234,
  onClose,
}, ref) => {
  const addItem = useCartStore(state => state.addItem);
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 200], [1, 0.5]);
  const scale = useTransform(y, [0, 200], [1, 0.95]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.y > 100) {
      onClose();
    }
  };

  return (
    <motion.div
      ref={ref}
      className="fixed inset-0 z-50 bg-background md:hidden"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      style={{ opacity, scale, y }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
    >
      {/* Drag indicator */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-muted-foreground/30 rounded-full z-10" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 pt-safe">
        <motion.button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center"
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>
        
        <div className="flex gap-2">
          <motion.button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center ${
              isWishlisted ? 'bg-destructive' : 'bg-background/80'
            }`}
            whileTap={{ scale: 0.9 }}
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current text-white' : ''}`} />
          </motion.button>
          <motion.button
            className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
          >
            <Share className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Image */}
      <div className="h-[45vh] relative">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        {discount !== undefined && discount > 0 && (
          <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-bold">
            -{discount}%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 -mt-10 relative">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-1 rounded-lg bg-muted text-xs font-medium">{platform}</span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-accent fill-accent" />
            <span className="text-sm font-medium">{rating}</span>
            <span className="text-xs text-muted-foreground">({reviews})</span>
          </div>
        </div>

        <h2 className="font-heading text-2xl font-bold mb-4">{title}</h2>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-success">{Math.round(price)} kr</span>
            {originalPrice && originalPrice > price && (
              <span className="text-lg text-muted-foreground line-through">{Math.round(originalPrice)} kr</span>
            )}
          </div>
          {originalPrice && originalPrice > price && (
            <span className="text-sm font-semibold text-destructive">
              Spar {Math.round(originalPrice - price)} kr
            </span>
          )}
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-success" />
            30 sek levering
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-success" />
            Garanti
          </span>
        </div>

        {/* CTA */}
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button 
            variant="success" 
            size="lg" 
            className="w-full h-14 text-lg font-semibold"
            onClick={() => {
              setIsAdding(true);
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
              setTimeout(() => {
                setIsAdding(false);
                onClose();
              }, 500);
            }}
            disabled={isAdding}
          >
            {isAdding ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <ShoppingCart className="w-5 h-5 mr-2" />
            )}
            {isAdding ? 'Tilføjer...' : 'Køb Nu'}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
});

MobileGameCard.displayName = "MobileGameCard";

export default MobileGameCard;
import { motion } from "framer-motion";
import { Star, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
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
  };

  return (
    <motion.button
      onClick={onClick}
      className="w-full bg-card/80 backdrop-blur-sm rounded-3xl overflow-hidden border border-border/30 text-left active:scale-[0.97] transition-all duration-300 shadow-premium hover:shadow-premium-lg hover:border-success/20"
      whileTap={{ scale: 0.97 }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3]">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        
        {discount && discount > 0 && (
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold shadow-sm">
            -{discount}%
          </div>
        )}
        
        <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-background/80 backdrop-blur-md text-[10px] font-semibold shadow-sm">
          {platform}
        </div>

        {/* Quick add */}
        <motion.div
          className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-2xl bg-success flex items-center justify-center shadow-glow"
          whileTap={{ scale: 0.9 }}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="w-4 h-4 text-success-foreground" />
        </motion.div>
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

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-success">{Math.round(price)} kr</span>
          {originalPrice && originalPrice > price && (
            <span className="text-xs text-muted-foreground line-through">{Math.round(originalPrice)} kr</span>
          )}
        </div>
      </div>
    </motion.button>
  );
};

export default MobileGameTile;
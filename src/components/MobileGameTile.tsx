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
      className="w-full bg-card rounded-2xl overflow-hidden border border-border/50 text-left active:scale-[0.98] transition-transform"
      whileTap={{ scale: 0.98 }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3]">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        
        {discount && discount > 0 && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold">
            -{discount}%
          </div>
        )}
        
        <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-background/90 backdrop-blur-sm text-[10px] font-semibold">
          {platform}
        </div>

        {/* Quick add */}
        <motion.div
          className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-success flex items-center justify-center shadow-lg"
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
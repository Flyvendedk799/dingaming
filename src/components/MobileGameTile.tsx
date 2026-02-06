import { Star, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { useRef } from "react";

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

  const handleAddToCart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
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

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const deltaTime = Date.now() - touchStartRef.current.time;
    
    // Only trigger click if it was a quick tap without much movement
    // This prevents triggering during scroll
    if (deltaX < 10 && deltaY < 10 && deltaTime < 300) {
      onClick();
    }
    
    touchStartRef.current = null;
  };

  const handleClick = (e: React.MouseEvent) => {
    // For desktop clicks
    onClick();
  };

  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full bg-card/80 backdrop-blur-sm rounded-3xl overflow-hidden border border-border/30 text-left cursor-pointer transition-all duration-200 shadow-premium hover:shadow-premium-lg hover:border-success/20 active:scale-[0.97]"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3]">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        
        {discount !== undefined && discount > 0 && (
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold shadow-sm">
            -{discount}%
          </div>
        )}
        
        <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-background/80 backdrop-blur-md text-[10px] font-semibold shadow-sm">
          {platform}
        </div>

        {/* Quick add */}
        <button
          className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-2xl bg-success flex items-center justify-center shadow-glow active:scale-90 transition-transform"
          onClick={handleAddToCart}
          onTouchEnd={(e) => {
            e.stopPropagation();
            handleAddToCart(e);
          }}
          style={{ touchAction: 'manipulation' }}
        >
          <ShoppingCart className="w-4 h-4 text-success-foreground" />
        </button>
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
    </div>
  );
};

export default MobileGameTile;

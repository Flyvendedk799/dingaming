import { useEffect, useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import { ChevronLeft, Heart, Share, Zap, Shield, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";
import { useIsWishlisted, useWishlist } from "@/stores/wishlistStore";
import { KinguinProduct } from "@/lib/kinguin";
import { usePricing } from "@/lib/pricing";
import { toast } from "sonner";

interface MobileGameCardProps {
  kinguinId: number;
  title: string;
  image: string;
  /** EUR sell price; converted to DKK for display + cart. */
  price: number;
  /** EUR original price. */
  originalPrice?: number;
  marginPercent?: number | null;
  platform: string;
  discount?: number;
  onClose: () => void;
}

const MobileGameCard = ({
  kinguinId,
  title,
  image,
  price,
  originalPrice,
  marginPercent,
  platform,
  discount,
  onClose,
}: MobileGameCardProps) => {
  const addItem = useCartStore(state => state.addItem);
  const { getPrice, formatDKK } = usePricing();
  const priceDkk = getPrice(price, marginPercent);
  const originalDkk = originalPrice ? getPrice(originalPrice, marginPercent) : 0;
  const [isAdding, setIsAdding] = useState(false);
  const isWishlisted = useIsWishlisted(kinguinId);
  const toggleWishlist = useWishlist((s) => s.toggle);

  // This sheet is handed loose props rather than a product, so the wishlist
  // entry is rebuilt from them — enough for the list to render a card.
  const wishlistEntry = {
    id: String(kinguinId),
    kinguin_id: kinguinId,
    name: title,
    cover_image: image,
    original_price: originalPrice ?? price,
    sell_price: price,
    margin_percent: marginPercent ?? null,
    platform,
    genres: null,
    is_available: true,
    qty: null,
  } as KinguinProduct;

  // Lock body scroll while the sheet is mounted (prevents stuck "no popup but no scroll" states)
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100) {
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] bg-background md:hidden"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      data-mobile-game-card
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
            onClick={() => {
              const added = toggleWishlist(wishlistEntry);
              toast.success(added ? 'Gemt på ønskelisten' : 'Fjernet fra ønskelisten');
            }}
            aria-label={isWishlisted ? 'Fjern fra ønskeliste' : 'Gem på ønskeliste'}
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
        <img
          src={image || '/placeholder.svg'}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        {discount !== undefined && discount > 0 && (
          <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-bold">
            -{discount}%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 -mt-10 relative">
        {/* The star rating and review count that used to sit here were both
            generated, not collected. */}
        <div className="mb-2 flex items-center gap-2">
          <span className="pill">{platform}</span>
        </div>

        <h2 className="font-heading text-2xl font-bold mb-4">{title}</h2>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-success">{formatDKK(priceDkk)}</span>
            {originalPrice && originalPrice > price && (
              <span className="text-lg text-muted-foreground line-through">{formatDKK(originalDkk)}</span>
            )}
          </div>
          {originalPrice && originalPrice > price && (
            <span className="text-sm font-semibold text-destructive">
              Spar {formatDKK(originalDkk - priceDkk)}
            </span>
          )}
        </div>

        {/* Trust badges */}
        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-primary" />
            Nøgle inden for 60 sekunder
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-primary" />
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
                variantId: `kinguin-${kinguinId}`,
                kinguinId,
                title,
                quantity: 1,
                price: {
                  amount: String(priceDkk),
                  currencyCode: 'DKK',
                },
                originalAmount:
                  originalPrice && originalPrice > price ? String(originalDkk) : undefined,
                image,
                sku: `KINGUIN-${kinguinId}`,
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
};

export default MobileGameCard;
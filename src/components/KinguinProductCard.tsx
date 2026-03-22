import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Check, Globe, Monitor, Clock, Eye, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KinguinProduct } from "@/lib/kinguin";
import { getShopifyVariantId } from "@/lib/shopify";
import { usePricing } from "@/lib/pricing";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface KinguinProductCardProps {
  product: KinguinProduct;
  index: number;
  onQuickView?: (product: KinguinProduct) => void;
}

const KinguinProductCard = ({ product, index, onQuickView }: KinguinProductCardProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const { getPrice, formatDKK, loading } = usePricing();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAdding(true);
    
    const variantRes = await getShopifyVariantId(product.kinguin_id);
    
    if (!variantRes.ok) {
      const { code } = variantRes as Extract<typeof variantRes, { ok: false }>;
      const description =
        code === 'NOT_SYNCED'
          ? 'Produktet er ikke synkroniseret til butikken endnu.'
          : code === 'PUBLISH_PERMISSION'
            ? 'Butikken kan ikke publicere produkter til Online Store endnu (mangler read/write publications).'
            : 'Produktet er ikke tilgængeligt i butikken endnu.';

      toast.error("Kunne ikke tilføje til kurv", {
        description,
      });
      setIsAdding(false);
      return;
    }
    
    addItem({
      variantId: variantRes.variantId,
      title: product.name,
      quantity: 1,
      price: variantRes.price,
      image: product.cover_image || undefined,
      sku: `KINGUIN-${product.kinguin_id}`
    });

    setIsAdding(false);
    setJustAdded(true);
    toast.success(`${product.name} tilføjet til kurv`);
    
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'Fjernet fra ønskeliste' : 'Tilføjet til ønskeliste');
  };

  const imageUrl = product.cover_image || '/placeholder.svg';
  const platform = product.platform || 'Steam';
  const regionLabel = product.region_name || (product.region_id === 3 ? 'Worldwide' : 'Europe');

  const priceInDkk = getPrice(product.sell_price, product.margin_percent);
  const originalPriceInDkk = getPrice(product.original_price * 1.3, product.margin_percent);
  const discountPercent = product.original_price > product.sell_price 
    ? Math.round((1 - product.sell_price / product.original_price) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link 
        to={`/product/${product.kinguin_id}`}
        className="group flex flex-col h-full bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/40 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 relative"
      >
        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Image overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Platform badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-background/95 backdrop-blur-md rounded-lg text-xs font-semibold shadow-lg border border-border/50">
            <Monitor className="w-3.5 h-3.5 text-primary" />
            {platform}
          </div>

          {/* Region badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-primary backdrop-blur-md rounded-lg text-xs font-semibold text-primary-foreground shadow-lg">
            <Globe className="w-3.5 h-3.5" />
            {regionLabel}
          </div>

          {/* Discount badge */}
          {discountPercent > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute bottom-3 left-3 px-2.5 py-1.5 bg-destructive backdrop-blur-md rounded-lg text-sm font-bold text-destructive-foreground shadow-lg"
            >
              -{discountPercent}%
            </motion.div>
          )}

          {/* Stock indicator */}
          {product.qty && product.qty > 0 && product.qty <= 5 && (
            <div className="absolute bottom-3 left-3 px-2.5 py-1.5 bg-accent backdrop-blur-md rounded-lg text-xs font-semibold text-accent-foreground shadow-lg animate-pulse">
              Kun {product.qty} tilbage
            </div>
          )}
          
          {/* Quick actions overlay */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Quick view button */}
            {onQuickView && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: isHovered ? 1 : 0.8, opacity: isHovered ? 1 : 0 }}
                transition={{ delay: 0.05 }}
                onClick={handleQuickView}
                className="w-12 h-12 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-background hover:scale-110 transition-all border border-border/50"
              >
                <Eye className="w-5 h-5 text-foreground" />
              </motion.button>
            )}
            
            {/* Wishlist button */}
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: isHovered ? 1 : 0.8, opacity: isHovered ? 1 : 0 }}
              transition={{ delay: 0.1 }}
              onClick={handleWishlist}
              className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-all border border-border/50 ${
                isWishlisted ? 'bg-destructive/90 text-destructive-foreground' : 'bg-background/90 hover:bg-background'
              }`}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </motion.button>
          </motion.div>
          
          {/* Instant delivery indicator */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-success/90 backdrop-blur-md rounded-lg text-[10px] font-semibold text-success-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Clock className="w-3 h-3" />
            30 sek
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4">
          <h3 className="font-semibold text-foreground line-clamp-2 mb-auto group-hover:text-primary transition-colors duration-300 leading-snug">
            {product.name}
          </h3>

          <div className="flex items-end justify-between gap-3 mt-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xl font-bold text-primary tracking-tight">
                {loading ? '...' : formatDKK(priceInDkk)}
              </span>
              {product.original_price !== product.sell_price && (
                <span className="text-xs text-muted-foreground line-through decoration-destructive/50">
                  {loading ? '...' : formatDKK(originalPriceInDkk)}
                </span>
              )}
            </div>
            
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={isAdding || !product.is_available}
                className={`shrink-0 transition-all duration-300 ${justAdded ? 'bg-success hover:bg-success' : ''}`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Tilføjet</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span className="ml-1">Køb</span>
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default KinguinProductCard;

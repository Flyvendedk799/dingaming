import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ShoppingCart, 
  Check, 
  Shield, 
  Zap, 
  Globe, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Heart,
  Share2,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KinguinProduct } from "@/lib/kinguin";
import { usePricing } from "@/lib/pricing";
import { useCartStore } from "@/stores/cartStore";
import { useIsWishlisted, useWishlist } from "@/stores/wishlistStore";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface QuickViewModalProps {
  product: KinguinProduct | null;
  onClose: () => void;
}

export const QuickViewModal = ({ product, onClose }: QuickViewModalProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const isWishlisted = useIsWishlisted(product?.kinguin_id);
  const toggleWishlist = useWishlist((s) => s.toggle);
  const addItem = useCartStore((state) => state.addItem);
  const { getPrice, formatDKK } = usePricing();

  if (!product) return null;

  const allImages = [
    product.cover_image,
    ...(product.screenshots || []).slice(0, 4)
  ].filter(Boolean) as string[];

  const priceDKK = getPrice(product.sell_price, product.margin_percent);
  const originalPriceDKK = getPrice(product.original_price, product.margin_percent);
  const discountPercent = product.original_price > product.sell_price 
    ? Math.round((1 - product.sell_price / product.original_price) * 100)
    : 0;
  const regionLabel = product.region_name || (product.region_id === 3 ? 'Worldwide' : 'Europe');

  const handleAddToCart = () => {
    if (!product.is_available) {
      toast.error("Udsolgt", { description: "Dette produkt er ikke tilgængeligt." });
      return;
    }

    setIsAdding(true);

    addItem({
      variantId: `kinguin-${product.kinguin_id}`,
      kinguinId: product.kinguin_id,
      title: product.name,
      quantity: 1,
      price: { amount: String(priceDKK), currencyCode: "DKK" },
      originalAmount:
        product.original_price > product.sell_price ? String(originalPriceDKK) : undefined,
      image: product.cover_image || undefined,
      sku: `KINGUIN-${product.kinguin_id}`,
    });

    setIsAdding(false);
    setJustAdded(true);
    toast.success(`${product.name} tilføjet til kurv`);

    setTimeout(() => setJustAdded(false), 2000);
  };

  const nextImage = () => setSelectedImage((prev) => (prev + 1) % allImages.length);
  const prevImage = () => setSelectedImage((prev) => (prev - 1 + allImages.length) % allImages.length);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product.name,
        url: `${window.location.origin}/product/${product.kinguin_id}`
      });
    } catch {
      navigator.clipboard.writeText(`${window.location.origin}/product/${product.kinguin_id}`);
      toast.success("Link kopieret!");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-card rounded-2xl border border-border shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid md:grid-cols-2 gap-0">
            {/* Left: Image gallery */}
            <div className="relative bg-muted aspect-square md:aspect-auto">
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={allImages[selectedImage] || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />

              {/* Image navigation */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === i 
                          ? 'border-primary ring-2 ring-primary/30' 
                          : 'border-border/50 hover:border-primary/50'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* One badge over a cover, and it is the discount. The pulsing
                  "Kun {qty} tilbage" is gone: a supplier's stock number is not
                  scarcity on a digital key. */}
              <div className="absolute top-4 left-4">
                {discountPercent > 0 && (
                  <Badge variant="destructive" className="num text-sm font-bold">
                    −{discountPercent}&nbsp;%
                  </Badge>
                )}
              </div>
            </div>

            {/* Right: Product info */}
            <div className="p-6 md:p-8 flex flex-col max-h-[80vh] md:max-h-none overflow-y-auto">
              {/* Platform & Region */}
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="text-xs">
                  {product.platform || 'Steam'}
                </Badge>
                <Badge className="bg-primary/10 text-primary border-0 text-xs">
                  <Globe className="w-3 h-3 mr-1" />
                  {regionLabel}
                </Badge>
              </div>

              {/* Title */}
              <h2 className="font-heading text-xl md:text-2xl text-foreground mb-4 leading-tight">
                {product.name}
              </h2>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-3xl font-bold text-primary">
                    {formatDKK(priceDKK)}
                  </span>
                  {product.original_price !== product.sell_price && (
                    <span className="text-lg text-muted-foreground line-through">
                      {formatDKK(originalPriceDKK)}
                    </span>
                  )}
                </div>
                {discountPercent > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-sm font-medium"
                  >
                    Du sparer {formatDKK(originalPriceDKK - priceDKK)}
                  </motion.div>
                )}
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                  <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Nøgle inden for 60 sekunder</p>
                    <p className="text-xs text-muted-foreground">Direkte til din e-mail</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Officiel Key</p>
                    <p className="text-[10px] text-muted-foreground">100% garanti</p>
                  </div>
                </div>
              </div>

              {/* Stock indicator */}
              {product.qty && product.qty > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Tilgængelighed</span>
                    <span className={product.qty <= 10 ? 'text-accent font-medium' : 'text-success'}>
                      {product.qty <= 10 ? `Kun ${product.qty} på lager` : 'På lager'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-success to-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (product.qty / 100) * 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mb-4">
                <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={isAdding || !product.is_available}
                    className={`w-full transition-all duration-300 ${
                      justAdded ? 'bg-success hover:bg-success' : ''
                    }`}
                  >
                    {justAdded ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Tilføjet!
                      </>
                    ) : isAdding ? (
                      <motion.div
                        className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Tilføj til kurv
                      </>
                    )}
                  </Button>
                </motion.div>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    if (!product) return;
                    const added = toggleWishlist(product);
                    toast.success(added ? 'Gemt på ønskelisten' : 'Fjernet fra ønskelisten');
                  }}
                  aria-label={isWishlisted ? 'Fjern fra ønskeliste' : 'Gem på ønskeliste'}
                  className={isWishlisted ? 'text-destructive border-destructive/30' : ''}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </Button>

                <Button size="lg" variant="outline" onClick={handleShare}>
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>

              {/* View full details link */}
              <Link 
                to={`/product/${product.kinguin_id}`}
                onClick={onClose}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                <ExternalLink className="w-4 h-4" />
                Se alle produktdetaljer
              </Link>

              {/* Genres */}
              {product.genres && product.genres.length > 0 && (
                <div className="mt-auto pt-6 border-t border-border/50">
                  <div className="flex flex-wrap gap-2">
                    {product.genres.slice(0, 5).map((genre, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickViewModal;

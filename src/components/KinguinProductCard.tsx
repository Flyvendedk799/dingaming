import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Check, Globe, Monitor } from "lucide-react";
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
}

const KinguinProductCard = ({ product, index }: KinguinProductCardProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const { getPrice, formatDKK, loading } = usePricing();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAdding(true);
    
    // Get the Shopify variant ID for checkout
    const shopifyVariantId = await getShopifyVariantId(product.kinguin_id);
    
    if (!shopifyVariantId) {
      toast.error("Kunne ikke tilføje til kurv", {
        description: "Produktet er ikke tilgængeligt i butikken endnu."
      });
      setIsAdding(false);
      return;
    }
    
    const priceInDkk = getPrice(product.sell_price, product.margin_percent);
    
    addItem({
      variantId: shopifyVariantId, // Use actual Shopify variant ID
      title: product.name,
      quantity: 1,
      price: {
        amount: priceInDkk.toFixed(2),
        currencyCode: 'DKK'
      },
      image: product.cover_image || undefined,
      sku: `KINGUIN-${product.kinguin_id}`
    });

    setIsAdding(false);
    setJustAdded(true);
    toast.success(`${product.name} tilføjet til kurv`);
    
    setTimeout(() => setJustAdded(false), 2000);
  };

  const imageUrl = product.cover_image || '/placeholder.svg';
  const platform = product.platform || 'Steam';
  const regionLabel = product.region_name || (product.region_id === 3 ? 'Worldwide' : 'Europe');

  const priceInDkk = getPrice(product.sell_price, product.margin_percent);
  const originalPriceInDkk = getPrice(product.original_price * 1.3, product.margin_percent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link 
        to={`/product/${product.kinguin_id}`}
        className="group block bg-card rounded-xl border border-border/50 overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
      >
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Platform badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-background/90 backdrop-blur-sm rounded-md text-xs font-medium">
            <Monitor className="w-3 h-3" />
            {platform}
          </div>

          {/* Region badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-primary/90 backdrop-blur-sm rounded-md text-xs font-medium text-primary-foreground">
            <Globe className="w-3 h-3" />
            {regionLabel}
          </div>

          {/* Stock indicator */}
          {product.qty > 0 && product.qty <= 5 && (
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-destructive/90 backdrop-blur-sm rounded-md text-xs font-medium text-destructive-foreground">
              Kun {product.qty} tilbage
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-foreground line-clamp-2 mb-3 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-primary">
                {loading ? '...' : formatDKK(priceInDkk)}
              </span>
              {product.original_price !== product.sell_price && (
                <span className="text-xs text-muted-foreground line-through">
                  {loading ? '...' : formatDKK(originalPriceInDkk)}
                </span>
              )}
            </div>
            
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={isAdding || !product.is_available}
              className="shrink-0"
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Tilføjet
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Køb
                </>
              )}
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default KinguinProductCard;

import { Button } from "@/components/ui/button";
import { ShoppingCart, Star, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShopifyProduct } from "@/lib/shopify";
import { useCartStore, CartItem } from "@/stores/cartStore";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface ShopifyProductCardProps {
  product: ShopifyProduct;
  index?: number;
}

const ShopifyProductCard = ({ product, index = 0 }: ShopifyProductCardProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const addItem = useCartStore(state => state.addItem);

  const { node } = product;
  const firstVariant = node.variants.edges[0]?.node;
  const firstImage = node.images.edges[0]?.node;
  const price = parseFloat(node.priceRange.minVariantPrice.amount);
  const currency = node.priceRange.minVariantPrice.currencyCode;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!firstVariant) return;

    const cartItem: CartItem = {
      variantId: firstVariant.id,
      title: node.title,
      price: firstVariant.price,
      quantity: 1,
      image: firstImage?.url
    };
    
    addItem(cartItem);
    setIsAdding(true);
    
    toast.success("Tilføjet til kurv", {
      description: node.title,
      position: "top-center"
    });
    
    setTimeout(() => setIsAdding(false), 1500);
  };

  return (
    <motion.div 
      className="game-card group"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1]
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Link to={`/product/${node.handle}`}>
        {/* Image container */}
        <div className="relative overflow-hidden">
          <motion.div
            className="w-full aspect-[4/5] bg-muted"
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            {firstImage ? (
              <img
                src={firstImage.url}
                alt={firstImage.altText || node.title}
                className="game-card-image w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
          </motion.div>
          
          <motion.div 
            className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Rating placeholder */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i}
                  className={`w-3.5 h-3.5 ${i < 4 ? 'text-primary fill-primary' : 'text-muted'}`} 
                />
              ))}
            </div>
            <span className="text-sm font-medium text-foreground">4.0</span>
          </div>

          {/* Title */}
          <h3 className="font-heading text-lg font-semibold text-foreground mb-3 line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-300">
            {node.title}
          </h3>

          {/* Price */}
          <div className="mb-4">
            <span className="text-2xl font-bold text-primary">
              {price.toFixed(2)} {currency}
            </span>
          </div>

          {/* CTA */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              className="w-full font-medium bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
              onClick={handleAddToCart}
              disabled={isAdding || !firstVariant?.availableForSale}
            >
              <AnimatePresence mode="wait">
                {isAdding ? (
                  <motion.div
                    key="added"
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Tilføjet!
                  </motion.div>
                ) : (
                  <motion.div
                    key="add"
                    className="flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {firstVariant?.availableForSale ? 'Tilføj til kurv' : 'Udsolgt'}
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>

          {/* Trust */}
          <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            <span>Officiel key med garanti</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ShopifyProductCard;

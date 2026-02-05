import { motion } from "framer-motion";
import { Clock, ChevronRight } from "lucide-react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { usePricing } from "@/lib/pricing";
import { Link } from "react-router-dom";

interface RecentlyViewedProps {
  excludeId?: number;
  maxItems?: number;
}

export const RecentlyViewed = ({ excludeId, maxItems = 6 }: RecentlyViewedProps) => {
  const { products } = useRecentlyViewed();
  const { getPrice, formatDKK } = usePricing();

  const filteredProducts = products
    .filter(p => p.kinguin_id !== excludeId)
    .slice(0, maxItems);

  if (filteredProducts.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-heading text-lg text-foreground">Senest set</h3>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
        {filteredProducts.map((product, index) => {
          const priceDKK = getPrice(product.sell_price, product.margin_percent);
          
          return (
            <motion.div
              key={product.kinguin_id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/product/${product.kinguin_id}`}
                className="group flex-shrink-0 w-36 flex flex-col"
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted mb-2">
                  <img
                    src={product.cover_image || '/placeholder.svg'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {product.name}
                </p>
                <p className="text-sm font-bold text-primary mt-1">
                  {formatDKK(priceDKK)}
                </p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
};

export default RecentlyViewed;

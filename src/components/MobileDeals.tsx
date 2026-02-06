import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Tag, ArrowLeft, Flame, Percent, Clock } from "lucide-react";
import { fetchKinguinProducts, KinguinProduct } from "@/lib/kinguin";
import MobileGameTile from "./MobileGameTile";
import FlipClock from "./FlipClock";
import MeshGradient from "./MeshGradient";
import { MobileProductGridSkeleton } from "./ui/ProductCardSkeleton";
import { getStableRating } from "@/lib/stableRating";

interface MobileDealsProps {
  onSelectGame: (product: KinguinProduct) => void;
  onBack: () => void;
}

const MobileDeals = ({ onSelectGame, onBack }: MobileDealsProps) => {
  const [products, setProducts] = useState<KinguinProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate end of day for countdown
  const dealEndTime = useMemo(() => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchKinguinProducts(50);
        // Sort by discount percentage
        const sorted = data.sort((a, b) => {
          const discountA = (1 - a.sell_price / a.original_price) * 100;
          const discountB = (1 - b.sell_price / b.original_price) * 100;
          return discountB - discountA;
        });
        setProducts(sorted);
      } catch (e) {
        console.error('Error loading products:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Group by discount tiers
  const over50 = products.filter(p => (1 - p.sell_price / p.original_price) >= 0.5);
  const over30 = products.filter(p => {
    const d = 1 - p.sell_price / p.original_price;
    return d >= 0.3 && d < 0.5;
  });
  const under30 = products.filter(p => (1 - p.sell_price / p.original_price) < 0.3);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div 
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 active:scale-95 transition-transform">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="font-heading text-xl font-bold flex items-center gap-2">
                <Tag className="w-5 h-5 text-accent" />
                Tilbud
              </h1>
              <p className="text-xs text-muted-foreground">De bedste priser på spil</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Banner with Countdown */}
      <div className="px-4 py-4">
        <motion.div 
          className="relative p-5 rounded-3xl overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <MeshGradient colors="accent" intensity="medium" />
          <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-transparent" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <motion.div 
                className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center"
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
              >
                <Flame className="w-6 h-6 text-accent" />
              </motion.div>
              <div>
                <h2 className="font-semibold text-foreground text-lg">Op til 70% rabat!</h2>
                <p className="text-sm text-muted-foreground">Begrænset tid</p>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-destructive" />
                <span className="text-xs font-medium text-destructive">Udløber om</span>
              </div>
              <FlipClock 
                targetDate={dealEndTime} 
                size="sm"
                showLabels={true}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="px-4">
          <MobileProductGridSkeleton count={6} />
        </div>
      ) : (
        <div className="px-4">
          {/* 50%+ off */}
          {over50.length > 0 && (
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <motion.div 
                  className="px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive text-xs font-bold flex items-center gap-1.5"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Percent className="w-3.5 h-3.5" />
                  50%+ RABAT
                </motion.div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {over50.slice(0, 6).map((product, index) => (
                  <motion.div 
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <MobileGameTile 
                      title={product.name}
                      image={product.cover_image || ''}
                      price={product.sell_price}
                      originalPrice={product.original_price}
                      platform={product.platform || 'Steam'}
                      discount={Math.round((1 - product.sell_price / product.original_price) * 100)}
                      rating={getStableRating(product.id)}
                      onClick={() => onSelectGame(product)} 
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 30-50% off */}
          {over30.length > 0 && (
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="px-3 py-1.5 rounded-xl bg-accent/10 text-accent text-xs font-bold flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5" />
                  30-50% RABAT
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {over30.slice(0, 6).map((product, index) => (
                  <motion.div 
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                  >
                    <MobileGameTile 
                      title={product.name}
                      image={product.cover_image || ''}
                      price={product.sell_price}
                      originalPrice={product.original_price}
                      platform={product.platform || 'Steam'}
                      discount={Math.round((1 - product.sell_price / product.original_price) * 100)}
                      rating={getStableRating(product.id)}
                      onClick={() => onSelectGame(product)} 
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Under 30% */}
          {under30.length > 0 && (
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="px-3 py-1.5 rounded-xl bg-success/10 text-success text-xs font-bold flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  FLERE TILBUD
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {under30.slice(0, 6).map((product, index) => (
                  <motion.div 
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                  >
                    <MobileGameTile 
                      title={product.name}
                      image={product.cover_image || ''}
                      price={product.sell_price}
                      originalPrice={product.original_price}
                      platform={product.platform || 'Steam'}
                      discount={Math.round((1 - product.sell_price / product.original_price) * 100)}
                      rating={getStableRating(product.id)}
                      onClick={() => onSelectGame(product)} 
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileDeals;

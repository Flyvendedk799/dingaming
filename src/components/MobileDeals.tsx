import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tag, Loader2, ArrowLeft, Flame, Percent } from "lucide-react";
import { fetchKinguinProducts, KinguinProduct } from "@/lib/kinguin";
import MobileGameTile from "./MobileGameTile";

interface MobileDealsProps {
  onSelectGame: (product: KinguinProduct) => void;
  onBack: () => void;
}

const MobileDeals = ({ onSelectGame, onBack }: MobileDealsProps) => {
  const [products, setProducts] = useState<KinguinProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
            <button onClick={onBack} className="p-2 -ml-2">
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

      {/* Banner */}
      <div className="px-4 py-4">
        <motion.div 
          className="p-4 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <Flame className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Op til 70% rabat!</h2>
              <p className="text-sm text-muted-foreground">Begrænset tid</p>
            </div>
          </div>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="px-4">
          {/* 50%+ off */}
          {over50.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="px-2 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-bold flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  50%+ RABAT
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {over50.slice(0, 6).map((product) => (
                  <div key={product.id}>
                    <MobileGameTile 
                      title={product.name}
                      image={product.cover_image || ''}
                      price={product.sell_price}
                      originalPrice={product.original_price}
                      platform={product.platform || 'Steam'}
                      discount={Math.round((1 - product.sell_price / product.original_price) * 100)}
                      rating={4.5 + Math.random() * 0.5}
                      onClick={() => onSelectGame(product)} 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 30-50% off */}
          {over30.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="px-2 py-1 rounded-lg bg-accent/10 text-accent text-xs font-bold flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  30-50% RABAT
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {over30.slice(0, 6).map((product) => (
                  <div key={product.id}>
                    <MobileGameTile 
                      title={product.name}
                      image={product.cover_image || ''}
                      price={product.sell_price}
                      originalPrice={product.original_price}
                      platform={product.platform || 'Steam'}
                      discount={Math.round((1 - product.sell_price / product.original_price) * 100)}
                      rating={4.5 + Math.random() * 0.5}
                      onClick={() => onSelectGame(product)} 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Under 30% */}
          {under30.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="px-2 py-1 rounded-lg bg-success/10 text-success text-xs font-bold flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  FLERE TILBUD
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {under30.slice(0, 6).map((product) => (
                  <div key={product.id}>
                    <MobileGameTile 
                      title={product.name}
                      image={product.cover_image || ''}
                      price={product.sell_price}
                      originalPrice={product.original_price}
                      platform={product.platform || 'Steam'}
                      discount={Math.round((1 - product.sell_price / product.original_price) * 100)}
                      rating={4.5 + Math.random() * 0.5}
                      onClick={() => onSelectGame(product)} 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileDeals;

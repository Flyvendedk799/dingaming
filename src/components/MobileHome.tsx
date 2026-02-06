import { motion } from "framer-motion";
import { ChevronRight, Zap, Star, Shield, Sparkles, Loader2, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchKinguinProducts, KinguinProduct } from "@/lib/kinguin";
import { useAuth } from "@/contexts/AuthContext";
import { useShardBalance, useClaimDailyShards, useDailyLoginStreak } from "@/hooks/useShards";
import { Button } from "@/components/ui/button";
import MobileGameTile from "./MobileGameTile";

interface MobileHomeProps {
  onSelectGame: (product: KinguinProduct) => void;
}

const MobileHome = ({ onSelectGame }: MobileHomeProps) => {
  const [products, setProducts] = useState<KinguinProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { data: balance } = useShardBalance();
  const { data: lastLogin } = useDailyLoginStreak();
  const claimDaily = useClaimDailyShards();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchKinguinProducts(12);
        setProducts(data);
      } catch (e) {
        console.error('Error loading products:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const canClaimDaily = user && (!lastLogin || lastLogin.login_date !== today);

  const formatShards = (shards: number) => {
    if (shards >= 1000) {
      return `${(shards / 1000).toFixed(1)}k`;
    }
    return shards.toString();
  };

  const trendingProducts = products.slice(0, 6);
  const dealProducts = products.filter(p => {
    const discount = Math.round((1 - p.sell_price / p.original_price) * 100);
    return discount >= 20;
  }).slice(0, 6);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* iOS-style header with glassmorphism */}
      <div 
        className="sticky top-0 z-40 bg-background/60 backdrop-blur-2xl border-b border-border/30"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold">
                <span className="text-foreground">Din</span>
                <span className="text-success">Gaming</span>
              </h1>
              <p className="text-xs text-muted-foreground">Dit Gaming Univers</p>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <Link to="/club">
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-success/10 border border-success/20 shadow-sm backdrop-blur-sm">
                    <Sparkles className="w-4 h-4 text-success" />
                    <span className="text-sm font-semibold text-success">
                      {formatShards(balance?.balance || 0)}
                    </span>
                  </div>
                </Link>
              ) : (
                <Link to="/login">
                  <Button size="sm" variant="outline" className="gap-2 rounded-2xl">
                    <LogIn className="w-4 h-4" />
                    Log ind
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Claim Banner (if logged in and can claim) */}
      {canClaimDaily && (
        <motion.div 
          className="mx-4 mt-4 p-4 rounded-3xl bg-gradient-to-r from-success/20 to-success/5 border border-success/30 shadow-glow backdrop-blur-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground text-sm">Daglig Bonus Klar!</p>
              <p className="text-xs text-muted-foreground">Hent gratis shards</p>
            </div>
            <Button
              size="sm"
              className="bg-success hover:bg-success/90 text-success-foreground"
              onClick={() => claimDaily.mutate()}
              disabled={claimDaily.isPending}
            >
              {claimDaily.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Hent</>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Hero banner */}
      <div className="px-4 py-4">
        <motion.div 
          className="relative rounded-3xl overflow-hidden h-36 bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20 shadow-premium"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute inset-0 p-4 flex flex-col justify-between">
            <div>
              <span className="px-3 py-1.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold shadow-sm">
                🔥 HOT DEALS
              </span>
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground mb-0.5">
                Spar op til 70%
              </h2>
              <p className="text-sm text-muted-foreground">På tusindvis af spil</p>
            </div>
          </div>
          {products[0] && (
            <div className="absolute right-0 top-0 bottom-0 w-1/2">
              <img src={products[0].cover_image || ''} alt="" className="w-full h-full object-cover opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-r from-background to-transparent" />
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick info */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-around py-4 rounded-3xl bg-card/80 backdrop-blur-sm border border-border/30 shadow-premium">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-success mb-0.5">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-bold">30 sek</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Levering</span>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-success mb-0.5">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-bold">100%</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Garanti</span>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-success mb-0.5">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-bold">50K+</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Kunder</span>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Trending - Horizontal scroll */}
          <div className="mb-6">
            <div className="flex items-center justify-between px-4 mb-3">
              <h2 className="font-heading text-lg font-bold">Trending Nu 🔥</h2>
              <button 
                onClick={() => navigate('/search')}
                className="flex items-center text-success text-sm font-medium"
              >
                Se alle <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div 
              className="flex gap-3 px-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {trendingProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-[150px] snap-start"
                >
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

          {/* Best Deals */}
          <div className="px-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-lg font-bold">Bedste Tilbud 💰</h2>
              <button 
                onClick={() => navigate('/deals')}
                className="flex items-center text-success text-sm font-medium"
              >
                Se alle <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {(dealProducts.length > 0 ? dealProducts : products.slice(0, 6)).map((product) => (
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

          {/* Customer Club Promo */}
          {!user && (
            <motion.div
              className="mx-4 mb-6 p-5 rounded-3xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20 shadow-glow backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-success/20 flex items-center justify-center shadow-inner-glow">
                  <Sparkles className="w-6 h-6 text-success" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Customer Club</h3>
                  <p className="text-xs text-muted-foreground">Optjen points på alle køb!</p>
                </div>
                <Link to="/signup">
                  <Button size="sm" variant="outline" className="border-success text-success">
                    Tilmeld
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default MobileHome;

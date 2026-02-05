import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, X, Loader2, ArrowLeft, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchKinguinProducts, KinguinProduct } from "@/lib/kinguin";
import MobileGameTile from "./MobileGameTile";

interface MobileSearchProps {
  onSelectGame: (product: KinguinProduct) => void;
  onBack: () => void;
}

const MobileSearch = ({ onSelectGame, onBack }: MobileSearchProps) => {
  const [query, setQuery] = useState("");
  const [allProducts, setAllProducts] = useState<KinguinProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchKinguinProducts(50);
        setAllProducts(data);
      } catch (e) {
        console.error('Error loading products:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const platforms = [...new Set(allProducts.map(p => p.platform).filter(Boolean))];

  const filteredProducts = allProducts.filter(product => {
    const matchesQuery = query.length === 0 || 
      product.name.toLowerCase().includes(query.toLowerCase());
    const matchesPlatform = !selectedPlatform || product.platform === selectedPlatform;
    return matchesQuery && matchesPlatform;
  });

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
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Søg efter spil..."
                className="pl-10 pr-10 bg-muted border-0"
                autoFocus
              />
              {query && (
                <button 
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg ${showFilters ? 'bg-primary text-primary-foreground' : ''}`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div 
            className="px-4 pb-3"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
          >
            <p className="text-xs text-muted-foreground mb-2">Platform</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <Button
                size="sm"
                variant={selectedPlatform === null ? "default" : "outline"}
                onClick={() => setSelectedPlatform(null)}
                className="shrink-0"
              >
                Alle
              </Button>
              {platforms.slice(0, 5).map(platform => (
                <Button
                  key={platform}
                  size="sm"
                  variant={selectedPlatform === platform ? "default" : "outline"}
                  onClick={() => setSelectedPlatform(platform || null)}
                  className="shrink-0"
                >
                  {platform}
                </Button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Results */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'resultat' : 'resultater'}
              {query && ` for "${query}"`}
            </p>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-foreground font-medium">Ingen resultater</p>
                <p className="text-sm text-muted-foreground">Prøv et andet søgeord</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
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
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MobileSearch;

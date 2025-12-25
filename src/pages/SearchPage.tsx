import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import ShopifyProductCard from "@/components/ShopifyProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, X, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setProducts([]);
      setHasSearched(false);
      return;
    }
    
    setIsLoading(true);
    setHasSearched(true);
    
    // Update URL with search query
    setSearchParams({ q: searchQuery });
    
    const results = await fetchProducts(50, `title:*${searchQuery}*`);
    setProducts(results);
    setIsLoading(false);
  };

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const clearSearch = () => {
    setQuery("");
    setProducts([]);
    setHasSearched(false);
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="fixed top-24 right-4 z-50">
        <CartDrawer />
      </div>

      <main className="container mx-auto px-4 py-12">
        {/* Search Header */}
        <motion.div 
          className="max-w-3xl mx-auto text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
            Søg efter spil
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Find dit næste eventyr blandt vores udvalg af game keys
          </p>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Søg efter spil, f.eks. FIFA, GTA, Cyberpunk..."
                  className="pl-12 pr-10 h-14 text-lg bg-card border-border focus:border-primary"
                />
                {query && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <Button type="submit" size="lg" className="h-14 px-8">
                <Search className="w-5 h-5 mr-2" />
                Søg
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : hasSearched ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {products.length} {products.length === 1 ? "resultat" : "resultater"} for "{searchParams.get("q")}"
              </p>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product, index) => (
                  <motion.div
                    key={product.node.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <ShopifyProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <Search className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-heading text-2xl text-foreground mb-2">
                  Ingen resultater fundet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Prøv at søge efter noget andet
                </p>
                <Link to="/">
                  <Button variant="outline">
                    Se alle spil
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-heading text-2xl text-foreground mb-2">
              Søg efter spil
            </h3>
            <p className="text-muted-foreground">
              Indtast et søgeord for at finde spil
            </p>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;
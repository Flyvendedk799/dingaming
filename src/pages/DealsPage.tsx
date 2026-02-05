import { useState, useEffect } from "react";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShopifyProductCard from "@/components/ShopifyProductCard";
import { motion } from "framer-motion";
import { Loader2, Flame, Clock, Percent, Sparkles } from "lucide-react";

const DealsPage = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      const allProducts = await fetchProducts(50);
      setProducts(allProducts);
      setIsLoading(false);
    };
    loadProducts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Hero Banner */}
        <motion.div 
          className="relative rounded-2xl overflow-hidden mb-12 p-8 md:p-12"
          style={{
            background: "linear-gradient(135deg, hsl(var(--accent) / 0.2), hsl(var(--primary) / 0.1))"
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-6 h-6 text-accent" />
              <span className="text-accent font-semibold">Tilbud</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
              Hot Deals & Tilbud
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Spar stort på de bedste spil! Nye tilbud tilføjes løbende.
            </p>
          </div>
        </motion.div>

        {/* Deal Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: Percent, label: "Op til 70% rabat", desc: "Store besparelser" },
            { icon: Clock, label: "Tidsbegrænsede", desc: "Skynd dig!" },
            { icon: Sparkles, label: "Ugens tilbud", desc: "Friske deals" },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              className="p-4 rounded-xl bg-card border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">{item.label}</div>
                  <div className="text-sm text-muted-foreground">{item.desc}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : products.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="font-heading text-2xl text-foreground mb-6">
              Alle tilbud ({products.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <motion.div
                  key={product.node.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.3 }}
                >
                  <ShopifyProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Flame className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-heading text-2xl text-foreground mb-2">
              Ingen tilbud lige nu
            </h3>
            <p className="text-muted-foreground">
              Kom tilbage snart for nye deals!
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default DealsPage;
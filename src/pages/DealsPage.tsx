import { useState, useEffect, useMemo } from "react";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShopifyProductCard from "@/components/ShopifyProductCard";
import NewsletterBanner from "@/components/NewsletterBanner";
import FlipClock from "@/components/FlipClock";
import MeshGradient from "@/components/MeshGradient";
import { ProductGridSkeleton } from "@/components/ui/ProductCardSkeleton";
import { motion } from "framer-motion";
import { Flame, Clock, Percent, Sparkles, Zap } from "lucide-react";

const DealsPage = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate end of day for countdown
  const dealEndTime = useMemo(() => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }, []);

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
        {/* Hero Banner with Mesh Gradient */}
        <motion.div 
          className="relative rounded-3xl overflow-hidden mb-12 p-8 md:p-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <MeshGradient colors="accent" intensity="medium" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <motion.div 
                className="flex items-center gap-2 mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Flame className="w-7 h-7 text-accent" />
                </motion.div>
                <span className="text-accent font-semibold text-lg">Hot Deals</span>
              </motion.div>
              
              <motion.h1 
                className="font-heading text-4xl md:text-5xl lg:text-6xl text-foreground mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Dagens Tilbud
              </motion.h1>
              
              <motion.p 
                className="text-muted-foreground text-lg max-w-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Spar stort på de bedste spil! Nye tilbud hver dag.
              </motion.p>
            </div>

            {/* Countdown Timer */}
            <motion.div
              className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-destructive" />
                <span className="text-sm font-semibold text-destructive">Tilbud udløber om</span>
              </div>
              <FlipClock 
                targetDate={dealEndTime} 
                size="md"
                onComplete={() => window.location.reload()}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Deal Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: Percent, label: "Op til 70% rabat", desc: "Store besparelser", color: "destructive" },
            { icon: Zap, label: "Flash Deals", desc: "Begrænset tid!", color: "accent" },
            { icon: Sparkles, label: "Ugens Favoritter", desc: "Populære valg", color: "success" },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <div className="flex items-center gap-4">
                <motion.div 
                  className={`w-12 h-12 rounded-xl bg-${item.color}/10 flex items-center justify-center`}
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <item.icon className={`w-6 h-6 text-${item.color}`} />
                </motion.div>
                <div>
                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{item.label}</div>
                  <div className="text-sm text-muted-foreground">{item.desc}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : products.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl text-foreground">
                Alle tilbud ({products.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <motion.div
                  key={product.node.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.4 }}
                >
                  <ShopifyProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <motion.div 
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Flame className="w-10 h-10 text-muted-foreground" />
            </motion.div>
            <h3 className="font-heading text-2xl text-foreground mb-2">
              Ingen tilbud lige nu
            </h3>
            <p className="text-muted-foreground">
              Kom tilbage snart for nye deals!
            </p>
          </div>
        )}

        {/* Newsletter Banner */}
        <NewsletterBanner source="deals-page" />
      </main>

      <Footer />
    </div>
  );
};

export default DealsPage;
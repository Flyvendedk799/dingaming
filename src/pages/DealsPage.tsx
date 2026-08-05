import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { KinguinProduct } from "@/lib/kinguin";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import KinguinProductCard from "@/components/KinguinProductCard";
import NewsletterBanner from "@/components/NewsletterBanner";
import { ProductGridSkeleton } from "@/components/ui/ProductCardSkeleton";
import { motion } from "framer-motion";

const DealsPage = () => {
  const [products, setProducts] = useState<KinguinProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      // A deal is either an admin-flagged product or a genuine price
      // difference — never a "was" price we made up.
      const { data } = await supabase
        .from("kinguin_products")
        .select("*")
        .eq("is_available", true)
        .or("is_on_sale.eq.true,discount_percent.gt.0")
        .not("cover_image", "is", null)
        .neq("cover_image", "")
        .order("discount_percent", { ascending: false })
        .limit(48);
      setProducts((data || []) as KinguinProduct[]);
      setIsLoading(false);
    };
    loadProducts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* The countdown that used to sit here reset itself to 23:59:59 on
            every page load, so it promised a deadline that never arrived.
            "Op til 70% rabat" and "Flash Deals" were equally unverified. */}
        <div className="mb-10 border-b border-border pb-8">
          <h1 className="text-display text-4xl md:text-5xl">Tilbud</h1>
          <p className="mt-3 max-w-xl text-lg text-muted-foreground">
            Spil markeret som tilbud i butikken. Priserne er inkl. moms.
          </p>
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
                <KinguinProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="rounded-xl border border-border bg-card py-16 text-center">
            <h3 className="mb-2 text-2xl">Ingen tilbud lige nu</h3>
            <p className="mx-auto max-w-md text-muted-foreground">
              Der er ingen spil med nedsat pris i kataloget i øjeblikket. Hele udvalget er stadig
              åbent — priserne er inkl. moms.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/search">Se alle spil</Link>
            </Button>
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
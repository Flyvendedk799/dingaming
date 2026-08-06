import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { fetchKinguinProducts, KinguinProduct } from "@/lib/kinguin";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import KinguinProductCard from "@/components/KinguinProductCard";
import NewsletterBanner from "@/components/NewsletterBanner";
import { ProductGridSkeleton } from "@/components/ui/ProductCardSkeleton";
import { motion } from "framer-motion";
import { useSeo } from "@/lib/seo";

const DealsPage = () => {
  useSeo({ title: "Tilbud", description: "Spil med nedsat pris. Officielle digitale nøgler, priser inkl. moms.", path: "/deals" });
  const [products, setProducts] = useState<KinguinProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cheapest, setCheapest] = useState<KinguinProduct[]>([]);
  const [isLoadingCheap, setIsLoadingCheap] = useState(false);

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
      const found = (data || []) as KinguinProduct[];
      setProducts(found);
      setIsLoading(false);

      // Only pay for the fallback query when there is nothing to show.
      if (found.length === 0) {
        setIsLoadingCheap(true);
        // Ordered by stock rather than by price. Sorting the catalogue purely
        // by "cheapest" fills the page with asset-flip shovelware, which is a
        // poor first impression on the one page people arrive at ready to
        // spend. Widely-stocked titles under ~12 EUR are recognisable games at
        // a low price, which is what "billige spil" should mean.
        const cheap = await fetchKinguinProducts(24, undefined, {
          requireCoverImage: true,
          gamesOnly: true,
          order: "stocked",
          priceRange: { min: 3, max: 12 },
        });
        setCheapest(cheap);
        setIsLoadingCheap(false);
      }
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
          // No product currently carries a discount, so this page was a dead
          // end reached from both the main nav and the hero — the worst place
          // to send someone who arrived looking to spend money. Rather than
          // inventing a "was" price, it falls back to the genuinely cheapest
          // games and says plainly that these are prices, not reductions.
          <>
            <div className="mb-8 rounded-xl border border-border bg-card p-6">
              <h2 className="text-xl">Ingen nedsatte spil lige nu</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Vi opfinder ikke før-priser, så når der ikke er en reel rabat, siger vi det. Til
                gengæld er her et udvalg af de billigste spil i kataloget — alle priser er inkl.
                moms.
              </p>
            </div>

            <h2 className="mb-6 text-[26px]">Billige spil lige nu</h2>
            {isLoadingCheap ? (
              <ProductGridSkeleton count={8} />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {cheapest.map((product, index) => (
                  <KinguinProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Newsletter Banner */}
        <NewsletterBanner source="deals-page" />
      </main>

      <Footer />
    </div>
  );
};

export default DealsPage;
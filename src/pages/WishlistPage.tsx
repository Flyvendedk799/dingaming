import { Link } from "react-router-dom";
import { Heart, Trash2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import KinguinProductCard from "@/components/KinguinProductCard";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/stores/wishlistStore";
import { useSeo } from "@/lib/seo";

/**
 * Wishlist.
 *
 * The heart buttons have existed on three components for as long as the shop
 * has, but nothing stored what they saved and no page listed it — so this is
 * the first screen where a saved game actually goes. It is the cheapest reason
 * a visitor has to come back without being emailed.
 *
 * Deliberately not gated behind an account: the list lives in localStorage, so
 * it works on the first visit, which is exactly when someone is browsing and
 * not yet ready to buy.
 */
const WishlistPage = () => {
  useSeo({
    title: "Din ønskeliste",
    description: "De spil du har gemt til senere.",
    path: "/wishlist",
    noindex: true,
  });

  const items = useWishlist((s) => s.items);
  const clear = useWishlist((s) => s.clear);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-8">
          <div>
            <h1 className="text-display text-4xl md:text-5xl">Ønskeliste</h1>
            <p className="mt-3 max-w-xl text-lg text-muted-foreground">
              {items.length > 0
                ? "Gemt på denne enhed. Priserne opdateres automatisk."
                : "Du har ikke gemt nogen spil endnu."}
            </p>
          </div>
          {items.length > 0 && (
            <Button variant="ghost" onClick={clear} className="gap-2 text-muted-foreground">
              <Trash2 className="h-4 w-4" />
              Ryd listen
            </Button>
          )}
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((product, index) => (
              <KinguinProductCard key={product.kinguin_id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card py-16 text-center">
            <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="mb-2 text-2xl">Ingen gemte spil</h2>
            <p className="mx-auto max-w-md text-muted-foreground">
              Tryk på hjertet på et spil for at gemme det her. Listen ligger på din enhed — du
              behøver ikke en konto.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/search">Find spil</Link>
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default WishlistPage;

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchKinguinProducts, KinguinProduct } from "@/lib/kinguin";
import KinguinProductCard from "./KinguinProductCard";
import QuickViewModal from "./QuickViewModal";
import { Button } from "@/components/ui/button";
import { ArrowRight, Flame, Loader2, Package, RefreshCw } from "lucide-react";

const KinguinProductGrid = () => {
  const [quickViewProduct, setQuickViewProduct] = useState<KinguinProduct | null>(null);

  const { data: products = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['kinguin-products-grid'],
    queryFn: () => fetchKinguinProducts(12),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  if (isLoading) {
    return (
      <section id="spil" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (isError || products.length === 0) {
    return (
      <section id="spil" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                  <Flame className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-accent">Populære lige nu</span>
                </div>
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl text-foreground mb-2">
                Vores Spil
              </h2>
              <p className="text-muted-foreground">
                Game keys til alle platforme
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="font-heading text-2xl text-foreground mb-2">
              {isError ? 'Kunne ikke indlæse spil' : 'Ingen spil fundet'}
            </h3>
            <p className="text-muted-foreground max-w-md mb-6">
              {isError 
                ? 'Der opstod en fejl. Prøv at genindlæse siden.'
                : 'Der er ingen spil tilgængelige lige nu.'}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Prøv igen
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="spil" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                <Flame className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-accent">Populære lige nu</span>
              </div>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl text-foreground mb-2">
              Vores Spil
            </h2>
            <p className="text-muted-foreground">
              Game keys til alle platforme • 30% rabat
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {products.map((product, index) => (
            <KinguinProductCard
              key={product.id}
              product={product}
              index={index}
              onQuickView={setQuickViewProduct}
            />
          ))}
        </div>

        {/* Load More */}
        <div className="text-center">
          <Button variant="outline" size="lg" className="font-medium group">
            Se alle spil
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </section>
  );
};

export default KinguinProductGrid;

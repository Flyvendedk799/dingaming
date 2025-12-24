import { useEffect, useState } from "react";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import ShopifyProductCard from "./ShopifyProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Flame, Loader2, Package } from "lucide-react";

const ShopifyProductGrid = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      const data = await fetchProducts(12);
      setProducts(data);
      setIsLoading(false);
    };
    loadProducts();
  }, []);

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

  if (products.length === 0) {
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
                Opdateret hver time baseret på salg
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="font-heading text-2xl text-foreground mb-2">Ingen produkter endnu</h3>
            <p className="text-muted-foreground max-w-md">
              Der er endnu ingen produkter i butikken. Fortæl mig hvad du vil sælge, så opretter jeg produkterne for dig!
            </p>
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
              Opdateret hver time baseret på salg
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {products.map((product, index) => (
            <ShopifyProductCard
              key={product.node.id}
              product={product}
              index={index}
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
    </section>
  );
};

export default ShopifyProductGrid;

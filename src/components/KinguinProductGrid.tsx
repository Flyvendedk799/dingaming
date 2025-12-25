import { useEffect, useState } from "react";
import { fetchKinguinProducts, KinguinProduct, syncProducts } from "@/lib/kinguin";
import KinguinProductCard from "./KinguinProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Flame, Loader2, Package, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const KinguinProductGrid = () => {
  const [products, setProducts] = useState<KinguinProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ page: number; total: number } | null>(null);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await fetchKinguinProducts(12);
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Kunne ikke hente produkter');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async (startPage = 1) => {
    setIsSyncing(true);
    setSyncProgress({ page: startPage, total: 0 });
    try {
      toast.info(`Synkroniserer produkter fra side ${startPage}...`);
      const result = await syncProducts(true, startPage, (page, total) => {
        setSyncProgress({ page, total });
      });
      toast.success(`Synkroniserede ${result.synced} produkter til DB, ${result.shopifySynced} til Shopify`);
      await loadProducts();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Kunne ikke synkronisere produkter');
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  useEffect(() => {
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
                Game keys til alle platforme
              </p>
            </div>
            <Button 
              onClick={() => handleSync()} 
              disabled={isSyncing}
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing && syncProgress ? `Side ${syncProgress.page} (${syncProgress.total} produkter)` : 'Synkroniser fra Kinguin'}
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="font-heading text-2xl text-foreground mb-2">Ingen produkter endnu</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Klik på "Synkroniser fra Kinguin" for at hente spil fra Kinguin API
            </p>
            <Button onClick={() => handleSync()} disabled={isSyncing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing && syncProgress ? `Side ${syncProgress.page} (${syncProgress.total} produkter)` : 'Synkroniser nu'}
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
          <div className="flex gap-2">
            <Button 
              onClick={() => handleSync()} 
              disabled={isSyncing}
              variant="outline"
              className="shrink-0"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing && syncProgress ? `Side ${syncProgress.page} (${syncProgress.total})` : 'Synkroniser'}
            </Button>
            <Button 
              onClick={() => handleSync(230)} 
              disabled={isSyncing}
              variant="secondary"
              className="shrink-0"
            >
              Fortsæt fra side 230
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {products.map((product, index) => (
            <KinguinProductCard
              key={product.id}
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

export default KinguinProductGrid;

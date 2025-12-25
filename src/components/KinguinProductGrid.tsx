import { useEffect, useState } from "react";
import { fetchKinguinProducts, KinguinProduct, syncProducts, syncDbToShopify } from "@/lib/kinguin";
import KinguinProductCard from "./KinguinProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Flame, Loader2, Package, RefreshCw, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

const KinguinProductGrid = () => {
  const [products, setProducts] = useState<KinguinProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingToShopify, setIsSyncingToShopify] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ page: number; total: number } | null>(null);
  const [shopifyProgress, setShopifyProgress] = useState<{ offset: number; total: number } | null>(null);

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

  const handleSyncToShopify = async (startOffset?: number) => {
    const OFFSET_KEY = 'kinguin_shopify_sync_offset';
    const IN_PROGRESS_KEY = 'kinguin_shopify_sync_in_progress';

    const savedOffset = typeof window !== 'undefined'
      ? parseInt(window.localStorage.getItem(OFFSET_KEY) || '0')
      : 0;

    const effectiveOffset = startOffset ?? savedOffset;

    setIsSyncingToShopify(true);
    setShopifyProgress({ offset: effectiveOffset, total: 0 });

    try {
      toast.info(`Synkroniserer DB produkter til Shopify fra offset ${effectiveOffset}...`);

      const result = await syncDbToShopify(effectiveOffset, (nextOffset, total) => {
        setShopifyProgress({ offset: nextOffset, total });
      });

      toast.success(`Synkroniserede ${result.synced} produkter til Shopify`);
    } catch (error) {
      console.error('Shopify sync error:', error);
      toast.error('Kunne ikke synkronisere til Shopify');
    } finally {
      setIsSyncingToShopify(false);
      setShopifyProgress(null);

      // If the sync is still marked as in-progress, keep the saved offset for resume.
      const stillInProgress = typeof window !== 'undefined'
        ? window.localStorage.getItem(IN_PROGRESS_KEY) === 'true'
        : false;

      if (!stillInProgress && typeof window !== 'undefined') {
        window.localStorage.removeItem(OFFSET_KEY);
      }
    }
  };

  useEffect(() => {
    loadProducts();

    // Auto-resume Shopify sync if a previous run was interrupted.
    if (typeof window !== 'undefined') {
      const inProgress = window.localStorage.getItem('kinguin_shopify_sync_in_progress') === 'true';
      const resumeOffset = parseInt(window.localStorage.getItem('kinguin_shopify_sync_offset') || '0');

      if (inProgress && !isSyncingToShopify) {
        toast.info(`Fandt en afbrudt Shopify-synk. Fortsætter fra offset ${resumeOffset}...`);
        setTimeout(() => {
          handleSyncToShopify(resumeOffset);
        }, 300);
      }
    }
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
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => handleSync()} 
              disabled={isSyncing || isSyncingToShopify}
              variant="outline"
              className="shrink-0"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing && syncProgress ? `Side ${syncProgress.page} (${syncProgress.total})` : 'Synk fra Kinguin'}
            </Button>
            <Button 
              onClick={() => handleSyncToShopify(0)} 
              disabled={isSyncing || isSyncingToShopify}
              variant="default"
              className="shrink-0"
            >
              <ShoppingBag className={`w-4 h-4 mr-2 ${isSyncingToShopify ? 'animate-pulse' : ''}`} />
              {isSyncingToShopify && shopifyProgress ? `${shopifyProgress.total} til Shopify` : 'Synk alle til Shopify'}
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

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Crown, Gem, Loader2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';

interface ShardBundle {
  id: string;
  name: string;
  shards: number;
  basePrice: number; // DKK
  bonusPercent: number;
  totalShards: number;
  icon: typeof Sparkles;
  popular?: boolean;
  bestValue?: boolean;
}

// 1000 Shards = 1 DKK, +2% bonus per tier
const SHARD_BUNDLES: ShardBundle[] = [
  {
    id: 'SHARDS-5000',
    name: 'Starter',
    shards: 5000,
    basePrice: 5,
    bonusPercent: 2,
    totalShards: 5100, // 5000 + 2%
    icon: Sparkles,
  },
  {
    id: 'SHARDS-10000',
    name: 'Popular',
    shards: 10000,
    basePrice: 10,
    bonusPercent: 4,
    totalShards: 10400, // 10000 + 4%
    icon: Zap,
    popular: true,
  },
  {
    id: 'SHARDS-25000',
    name: 'Value',
    shards: 25000,
    basePrice: 25,
    bonusPercent: 6,
    totalShards: 26500, // 25000 + 6%
    icon: Crown,
  },
  {
    id: 'SHARDS-50000',
    name: 'Premium',
    shards: 50000,
    basePrice: 50,
    bonusPercent: 8,
    totalShards: 54000, // 50000 + 8%
    icon: Gem,
    bestValue: true,
  },
];

export const BuyShardsSection = () => {
  const [loadingBundle, setLoadingBundle] = useState<string | null>(null);
  const addItem = useCartStore(state => state.addItem);
  const isLoading = useCartStore(state => state.isLoading);

  const handleBuyBundle = async (bundle: ShardBundle) => {
    setLoadingBundle(bundle.id);
    
    try {
      // Add shard bundle to cart using the simpler CartItem interface
      // Note: Products must be created in Shopify first with matching SKUs
      addItem({
        variantId: bundle.id,
        title: `${bundle.name} - ${bundle.totalShards.toLocaleString('da-DK')} Shards`,
        price: {
          amount: bundle.basePrice.toFixed(2),
          currencyCode: 'DKK',
        },
        quantity: 1,
        sku: bundle.id,
      });

      toast.success(`${bundle.totalShards.toLocaleString('da-DK')} Shards tilføjet til kurv!`, {
        description: 'Gå til checkout for at gennemføre købet.',
      });
    } catch (error) {
      console.error('Failed to add shard bundle:', error);
      toast.error('Kunne ikke tilføje til kurv', {
        description: 'Prøv igen senere.',
      });
    } finally {
      setLoadingBundle(null);
    }
  };

  const formatShards = (shards: number) => {
    return new Intl.NumberFormat('da-DK').format(shards);
  };

  return (
    <motion.div
      className="bg-card border border-border rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading text-xl text-foreground flex items-center gap-2">
            <Gem className="w-5 h-5 text-accent" />
            Køb Shards
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            1.000 Shards = 1 DKK værdi • Betales via MobilePay/Kort
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SHARD_BUNDLES.map((bundle, index) => {
          const IconComponent = bundle.icon;
          const isBundleLoading = loadingBundle === bundle.id || isLoading;
          
          return (
            <motion.div
              key={bundle.id}
              className={`relative bg-background border rounded-xl p-4 transition-all hover:border-primary/50 hover:shadow-lg ${
                bundle.popular ? 'border-primary ring-1 ring-primary/20' : 'border-border'
              } ${bundle.bestValue ? 'border-accent ring-1 ring-accent/20' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              {bundle.popular && (
                <Badge className="absolute -top-2 right-3 bg-primary text-primary-foreground text-xs">
                  Populær
                </Badge>
              )}
              {bundle.bestValue && (
                <Badge className="absolute -top-2 right-3 bg-accent text-accent-foreground text-xs">
                  Bedste Værdi
                </Badge>
              )}
              
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  bundle.popular ? 'bg-primary/10 text-primary' : 
                  bundle.bestValue ? 'bg-accent/10 text-accent' : 
                  'bg-muted text-muted-foreground'
                }`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                  +{bundle.bonusPercent}% bonus
                </span>
              </div>

              <div className="mb-3">
                <p className="text-sm text-muted-foreground">{bundle.name}</p>
                <p className="text-2xl font-heading text-foreground">
                  {formatShards(bundle.totalShards)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">Shards</span>
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-foreground">
                  {bundle.basePrice} kr.
                </span>
                <Button
                  size="sm"
                  onClick={() => handleBuyBundle(bundle)}
                  disabled={isBundleLoading}
                  className={bundle.popular || bundle.bestValue ? '' : 'bg-muted text-foreground hover:bg-muted/80'}
                  variant={bundle.popular ? 'default' : bundle.bestValue ? 'default' : 'secondary'}
                >
                  {isBundleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Køb
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Shards tilføjes automatisk til din konto efter betaling
      </p>
    </motion.div>
  );
};

export default BuyShardsSection;

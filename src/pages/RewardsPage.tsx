import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Gift, Sparkles, Tag, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useShardBalance } from '@/hooks/useShards';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from 'sonner';

interface RewardItem {
  id: string;
  name: string;
  description: string;
  type: string;
  shard_cost: number;
  value_dkk: number | null;
  stock: number | null;
  image_url: string | null;
  is_active: boolean;
}

const RewardsPage = () => {
  const { user, session, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: balance } = useShardBalance();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const { data: rewards, isLoading: rewardsLoading } = useQuery({
    queryKey: ['reward-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reward_items')
        .select('*')
        .eq('is_active', true)
        .order('shard_cost', { ascending: true });
      
      if (error) throw error;
      return data as RewardItem[];
    },
  });

  const redeemMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      if (!session) throw new Error('Not authenticated');
      
      const response = await supabase.functions.invoke('redeem-reward', {
        body: { rewardId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shard-balance'] });
      queryClient.invalidateQueries({ queryKey: ['shard-transactions'] });
      toast.success('Reward indløst!', {
        description: `Din rabatkode: ${data.voucherCode}`,
        duration: 10000,
      });
    },
    onError: (error: Error) => {
      toast.error('Kunne ikke indløse reward', {
        description: error.message,
      });
    },
  });

  const formatShards = (shards: number) => {
    return new Intl.NumberFormat('da-DK').format(shards);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Back link */}
        <Link 
          to="/club" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Tilbage til Club
        </Link>

        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-2">
            Reward Shop
          </h1>
          <p className="text-muted-foreground">
            Brug dine Shards til eksklusive rabatter og belønninger
          </p>
        </motion.div>

        {/* Balance indicator */}
        <motion.div
          className="bg-card border border-border rounded-xl p-4 mb-8 inline-flex items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-muted-foreground">Din balance:</span>
          <span className="font-heading text-2xl text-primary">
            {formatShards(balance?.balance || 0)}
          </span>
          <span className="text-muted-foreground">Shards</span>
        </motion.div>

        {/* Rewards Grid */}
        {rewardsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
                <div className="h-8 bg-muted rounded w-3/4 mb-4" />
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-2/3 mb-6" />
                <div className="h-10 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : rewards && rewards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward, index) => {
              const canAfford = (balance?.balance || 0) >= reward.shard_cost;
              const isVoucher = reward.type === 'voucher';

              return (
                <motion.div
                  key={reward.id}
                  className={`bg-card border rounded-2xl p-6 transition-all ${
                    canAfford 
                      ? 'border-border hover:border-primary/50' 
                      : 'border-border opacity-60'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    isVoucher ? 'bg-club/10' : 'bg-primary/10'
                  }`}>
                    {isVoucher ? (
                      <Tag className={`w-6 h-6 ${isVoucher ? 'text-club' : 'text-primary'}`} />
                    ) : (
                      <Gift className="w-6 h-6 text-primary" />
                    )}
                  </div>

                  {/* Content */}
                  <h3 className="font-heading text-xl text-foreground mb-2">
                    {reward.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {reward.description}
                  </p>

                  {/* Value indicator for vouchers */}
                  {reward.value_dkk && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-club/10 text-club rounded-full text-sm mb-4">
                      <Check className="w-3 h-3" />
                      {reward.value_dkk} DKK værdi
                    </div>
                  )}

                  {/* Cost and action */}
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                    <div>
                      <span className="font-heading text-xl text-primary">
                        {formatShards(reward.shard_cost)}
                      </span>
                      <span className="text-muted-foreground text-sm ml-1">Shards</span>
                    </div>
                    <Button
                      size="sm"
                      disabled={!canAfford || redeemMutation.isPending}
                      onClick={() => redeemMutation.mutate(reward.id)}
                      className={canAfford 
                        ? 'bg-primary hover:bg-primary/90' 
                        : 'bg-muted text-muted-foreground'
                      }
                    >
                      {redeemMutation.isPending ? 'Indløser...' : 'Indløs'}
                    </Button>
                  </div>

                  {/* Not enough shards message */}
                  {!canAfford && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Du mangler {formatShards(reward.shard_cost - (balance?.balance || 0))} Shards
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Gift className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-heading text-xl text-foreground mb-2">
              Ingen rewards tilgængelige
            </h3>
            <p className="text-muted-foreground">
              Kom tilbage snart for at se nye belønninger!
            </p>
          </div>
        )}

        {/* Info section */}
        <motion.div
          className="mt-12 p-6 bg-card border border-border rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="font-semibold text-foreground mb-3">Sådan virker det</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-club mt-0.5 shrink-0" />
              Vælg en reward du vil indløse
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-club mt-0.5 shrink-0" />
              Dine Shards trækkes automatisk fra din balance
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-club mt-0.5 shrink-0" />
              Rabatkoder kan bruges ved checkout og er gyldige i 30 dage
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-club mt-0.5 shrink-0" />
              Du kan finde dine indløste rewards under "Mine Rewards"
            </li>
          </ul>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default RewardsPage;

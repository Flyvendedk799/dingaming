import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ShardBalance {
  user_id: string;
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  updated_at: string;
}

interface ShardTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  reference_id: string | null;
  created_at: string;
}

interface DailyLogin {
  id: string;
  user_id: string;
  login_date: string;
  streak_count: number;
  shards_awarded: number;
  created_at: string;
}

export const useShardBalance = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['shard-balance', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('shard_balances')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as ShardBalance | null;
    },
    enabled: !!user,
  });
};

export const useShardTransactions = (limit = 20) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['shard-transactions', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('shard_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as ShardTransaction[];
    },
    enabled: !!user,
  });
};

export const useDailyLoginStreak = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['daily-login-streak', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('daily_logins')
        .select('*')
        .eq('user_id', user.id)
        .order('login_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as DailyLogin | null;
    },
    enabled: !!user,
  });
};

export const useClaimDailyShards = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('Not authenticated');
      
      const response = await supabase.functions.invoke('claim-daily-shards', {
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
      queryClient.invalidateQueries({ queryKey: ['daily-login-streak'] });
      toast.success(`+${data.shardsAwarded} Shards!`, {
        description: data.streakCount > 1 
          ? `${data.streakCount} dag streak! 🔥` 
          : 'Daglig login bonus!',
      });
    },
    onError: (error: Error) => {
      if (error.message.includes('already claimed')) {
        toast.info('Du har allerede hentet din daglige bonus!');
      } else {
        toast.error('Kunne ikke hente daglig bonus');
      }
    },
  });
};

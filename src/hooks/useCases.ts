import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CaseItem {
  id: string;
  kinguin_product_id: string;
  drop_percentage: number;
  kinguin_products: {
    id: string;
    name: string;
    sell_price: number;
    cover_image: string | null;
    platform: string | null;
  };
}

export interface ShardCase {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  calculated_price: number;
  is_active: boolean;
  display_order: number;
  items?: CaseItem[];
}

export interface OpenCaseResult {
  success: boolean;
  wonItem: {
    id: string;
    productId: string;
    name: string;
    price: number;
    image: string | null;
    dropPercentage: number;
  };
  shardsSpent: number;
  allItems: Array<{
    id: string;
    name: string;
    price: number;
    image: string | null;
    dropPercentage: number;
  }>;
}

export function useCases() {
  return useQuery({
    queryKey: ['shard-cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shard_cases')
        .select(`
          *,
          shard_case_items (
            id,
            kinguin_product_id,
            drop_percentage,
            kinguin_products (
              id,
              name,
              sell_price,
              cover_image,
              platform
            )
          )
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(c => ({
        ...c,
        items: c.shard_case_items as unknown as CaseItem[],
      })) as ShardCase[];
    },
  });
}

export function useAdminCases() {
  return useQuery({
    queryKey: ['admin-shard-cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shard_cases')
        .select(`
          *,
          shard_case_items (
            id,
            kinguin_product_id,
            drop_percentage,
            kinguin_products (
              id,
              name,
              sell_price,
              cover_image,
              platform
            )
          )
        `)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(c => ({
        ...c,
        items: c.shard_case_items as unknown as CaseItem[],
      })) as ShardCase[];
    },
  });
}

export function useOpenCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (caseId: string): Promise<OpenCaseResult> => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Du skal være logget ind for at åbne cases');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/open-case`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ caseId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Kunne ikke åbne casen');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shard-balance'] });
      queryClient.invalidateQueries({ queryKey: ['shard-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['case-openings'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCaseOpenings(limit = 10) {
  return useQuery({
    queryKey: ['case-openings', limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('shard_case_openings')
        .select(`
          *,
          shard_cases (name, image_url),
          shard_case_items (
            kinguin_products (name, cover_image, sell_price)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
  });
}

// Calculate fair price with 10% house edge
export function calculateCasePrice(items: Array<{ sell_price: number; drop_percentage: number }>): number {
  const expectedValue = items.reduce((sum, item) => {
    return sum + (item.sell_price * item.drop_percentage / 100);
  }, 0);
  
  // Convert to shards (1 DKK = 1000 shards) and apply 10% house edge (multiply by 0.90)
  const priceInShards = Math.round(expectedValue * 1000 * 0.90);
  
  return priceInShards;
}

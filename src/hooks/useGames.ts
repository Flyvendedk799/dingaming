import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface GameSessionState {
  mines: number[];
  revealed: number[];
  betAmount: number;
  currentMultiplier: number;
  cashedOut: boolean;
  hitMine: boolean;
}

interface ActiveGameSession {
  session_id: string;
  user_id: string;
  game_type: string;
  state: GameSessionState;
  is_active: boolean;
  created_at: string;
}

interface MinesStartResponse {
  success: boolean;
  sessionId: string;
  mineCount: number;
  betAmount: number;
  nextMultiplier: number;
  state?: GameSessionState;
  restored?: boolean;
}

interface MinesRevealResponse {
  success: boolean;
  hitMine: boolean;
  revealed: number[];
  currentMultiplier?: number;
  nextMultiplier?: number;
  potentialWin?: number;
  mines?: number[];
  winAmount?: number;
  autoWin?: boolean;
  cashedOut?: boolean;
}

interface MinesCashoutResponse {
  success: boolean;
  cashedOut: boolean;
  winAmount: number;
  multiplier: number;
  mines: number[];
  revealed: number[];
}

interface DicePlayResponse {
  success: boolean;
  roll: number;
  isWin: boolean;
  targetNumber: number;
  isOver: boolean;
  multiplier: number;
  betAmount: number;
  winAmount: number;
  newBalance: number;
  winChance: number;
}

// Hook to fetch active game session (for page refresh restoration)
export const useActiveGameSession = (gameType: 'mines' | 'dice' | 'blackjack') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['active-game-session', gameType, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_type', gameType)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching active session:', error);
        return null;
      }
      
      if (!data) return null;
      
      // Type assertion with proper handling of Json type
      return {
        session_id: data.session_id,
        user_id: data.user_id,
        game_type: data.game_type,
        state: data.state as unknown as GameSessionState,
        is_active: data.is_active,
        created_at: data.created_at,
      } as ActiveGameSession;
    },
    enabled: !!user,
    staleTime: 1000, // Don't refetch too frequently
  });
};

export const useStartMinesGame = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({ betAmount, mineCount }: { betAmount: number; mineCount: number }): Promise<MinesStartResponse> => {
      if (!session) throw new Error('Not authenticated');
      
      const response = await supabase.functions.invoke('play-mines', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          action: 'start',
          betAmount,
          mineCount,
        },
      });
      
      if (response.error) throw response.error;
      if (!response.data.success) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate balance and active session
      queryClient.invalidateQueries({ queryKey: ['shard-balance'] });
      queryClient.invalidateQueries({ queryKey: ['shard-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['active-game-session', 'mines'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Kunne ikke starte spil');
    },
  });
};

export const useRevealMinesTile = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({ sessionId, tileIndex }: { sessionId: string; tileIndex: number }): Promise<MinesRevealResponse> => {
      if (!session) throw new Error('Not authenticated');
      
      const response = await supabase.functions.invoke('play-mines', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          action: 'reveal',
          sessionId,
          tileIndex,
        },
      });
      
      if (response.error) throw response.error;
      if (!response.data.success) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.hitMine || data.autoWin || data.cashedOut) {
        queryClient.invalidateQueries({ queryKey: ['shard-balance'] });
        queryClient.invalidateQueries({ queryKey: ['shard-transactions'] });
        queryClient.invalidateQueries({ queryKey: ['active-game-session', 'mines'] });
      }
    },
  });
};

export const useCashoutMines = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string }): Promise<MinesCashoutResponse> => {
      if (!session) throw new Error('Not authenticated');
      
      const response = await supabase.functions.invoke('play-mines', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          action: 'cashout',
          sessionId,
        },
      });
      
      if (response.error) throw response.error;
      if (!response.data.success) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shard-balance'] });
      queryClient.invalidateQueries({ queryKey: ['shard-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['active-game-session', 'mines'] });
      toast.success(`+${data.winAmount} Shards!`, {
        description: `x${data.multiplier} multiplier`,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Kunne ikke udbetale');
    },
  });
};

export const usePlayDice = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({ betAmount, targetNumber, isOver }: { 
      betAmount: number; 
      targetNumber: number; 
      isOver: boolean;
    }): Promise<DicePlayResponse> => {
      if (!session) throw new Error('Not authenticated');
      
      const response = await supabase.functions.invoke('play-dice', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          betAmount,
          targetNumber,
          isOver,
        },
      });
      
      if (response.error) throw response.error;
      if (!response.data.success) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shard-balance'] });
      queryClient.invalidateQueries({ queryKey: ['shard-transactions'] });
      
      if (data.isWin) {
        toast.success(`Vandt ${data.winAmount} Shards!`, {
          description: `Terning: ${data.roll} (x${data.multiplier})`,
        });
      } else {
        toast.error(`Tabte ${data.betAmount} Shards`, {
          description: `Terning: ${data.roll}`,
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Kunne ikke spille');
    },
  });
};

// Calculate dice multiplier on the client (for display purposes)
export const calculateDiceMultiplier = (winChance: number): number => {
  const payout = (100 / winChance) * 0.97;
  return Math.floor(payout * 100) / 100;
};

// Calculate mines multiplier on the client (for display purposes)
export const calculateMinesMultiplier = (revealed: number, mineCount: number): number => {
  const totalTiles = 25;
  const safeTiles = totalTiles - mineCount;
  
  if (revealed === 0) return 1;
  
  let multiplier = 1;
  for (let i = 0; i < revealed; i++) {
    const remaining = totalTiles - i;
    const safeRemaining = safeTiles - i;
    multiplier *= remaining / safeRemaining;
  }
  
  return Math.floor(multiplier * 0.97 * 100) / 100;
};

// ----- Blackjack -----

interface BlackjackResponse {
  success: boolean;
  sessionId: string;
  playerHand: Array<{ suit: string; rank: string; value: number }>;
  dealerHand: Array<{ suit: string; rank: string; value: number }>;
  playerValue: number;
  dealerValue: number;
  betAmount: number;
  status: string;
  winAmount?: number;
  newBalance?: number;
  restored?: boolean;
}

export const usePlayBlackjack = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      action: 'deal' | 'hit' | 'stand';
      betAmount?: number;
      sessionId?: string;
    }): Promise<BlackjackResponse> => {
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('play-blackjack', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: params,
      });

      if (response.error) throw response.error;
      if (!response.data.success) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: (data) => {
      const ended = data.status !== 'playing';
      if (ended) {
        queryClient.invalidateQueries({ queryKey: ['shard-balance'] });
        queryClient.invalidateQueries({ queryKey: ['shard-transactions'] });
        queryClient.invalidateQueries({ queryKey: ['active-game-session', 'blackjack'] });

        if (data.status === 'blackjack') {
          toast.success(`BLACKJACK! +${data.winAmount} Shards!`);
        } else if (data.status === 'player_win' || data.status === 'dealer_bust') {
          toast.success(`Vandt ${data.winAmount} Shards!`);
        } else if (data.status === 'push') {
          toast.info('Push – indsats returneret');
        } else if (data.status === 'player_bust' || data.status === 'dealer_win') {
          toast.error(`Tabte ${data.betAmount} Shards`);
        }
      }
      if (data.status === 'playing' && data.restored) {
        // balance already deducted
      } else if (!ended) {
        queryClient.invalidateQueries({ queryKey: ['shard-balance'] });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Kunne ikke spille');
    },
  });
};

// ----- Sell Case Item -----

export const useSellCaseItem = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (openingId: string): Promise<{ success: boolean; shardsReceived: number; productName: string }> => {
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('sell-case-item', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { openingId },
      });

      if (response.error) throw response.error;
      if (!response.data.success) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shard-balance'] });
      queryClient.invalidateQueries({ queryKey: ['shard-transactions'] });
      toast.success(`+${new Intl.NumberFormat('da-DK').format(data.shardsReceived)} Shards!`, {
        description: `Solgte ${data.productName}`,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Kunne ikke sælge');
    },
  });
};
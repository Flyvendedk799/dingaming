import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface MinesStartResponse {
  success: boolean;
  sessionId: string;
  mineCount: number;
  betAmount: number;
  nextMultiplier: number;
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
      queryClient.invalidateQueries({ queryKey: ['shard-balance'] });
      queryClient.invalidateQueries({ queryKey: ['shard-transactions'] });
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

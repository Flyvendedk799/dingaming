import { supabase } from '@/integrations/supabase/client';

// Cache settings to avoid repeated DB calls
let settingsCache: {
  globalMargin: number;
  eurToDkkRate: number;
  lastFetched: number;
} | null = null;

const CACHE_TTL = 60000; // 1 minute

export async function getSettings(): Promise<{ globalMargin: number; eurToDkkRate: number }> {
  if (settingsCache && Date.now() - settingsCache.lastFetched < CACHE_TTL) {
    return { globalMargin: settingsCache.globalMargin, eurToDkkRate: settingsCache.eurToDkkRate };
  }

  const { data: settings } = await supabase
    .from('store_settings')
    .select('key, value')
    .in('key', ['global_margin_percent', 'eur_to_dkk_rate']);

  let globalMargin = 30;
  let eurToDkkRate = 7.46;

  if (settings) {
    for (const setting of settings) {
      if (setting.key === 'global_margin_percent') {
        globalMargin = Number(setting.value) || 30;
      } else if (setting.key === 'eur_to_dkk_rate') {
        eurToDkkRate = Number(setting.value) || 7.46;
      }
    }
  }

  settingsCache = { globalMargin, eurToDkkRate, lastFetched: Date.now() };
  return { globalMargin, eurToDkkRate };
}

export function calculateFinalPrice(
  sellPriceEur: number,
  productMargin: number | null,
  globalMargin: number,
  eurToDkkRate: number
): number {
  const margin = productMargin ?? globalMargin;
  const priceWithMargin = sellPriceEur * (1 + margin / 100);
  return priceWithMargin * eurToDkkRate;
}

export function formatDKK(amount: number): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDKKDetailed(amount: number): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// Hook for React components
import { useState, useEffect } from 'react';

export function usePricing() {
  const [settings, setSettings] = useState<{ globalMargin: number; eurToDkkRate: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .finally(() => setLoading(false));
  }, []);

  const getPrice = (sellPriceEur: number, productMargin?: number | null): number => {
    if (!settings) return sellPriceEur * 7.46 * 1.3; // Fallback
    return calculateFinalPrice(sellPriceEur, productMargin ?? null, settings.globalMargin, settings.eurToDkkRate);
  };

  return { settings, loading, getPrice, formatDKK, formatDKKDetailed };
}

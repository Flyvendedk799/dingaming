// Server-side pricing helpers. Mirrors src/lib/pricing.ts so the client and
// server agree on the final DKK price, but the server is always authoritative.

export interface StoreSettings {
  globalMargin: number
  eurToDkkRate: number
}

export async function getStoreSettings(supabase: any): Promise<StoreSettings> {
  const { data } = await supabase
    .from('store_settings')
    .select('key, value')
    .in('key', ['global_margin_percent', 'eur_to_dkk_rate'])

  let globalMargin = 30
  let eurToDkkRate = 7.46

  if (data) {
    for (const s of data) {
      if (s.key === 'global_margin_percent') globalMargin = Number(s.value) || 30
      if (s.key === 'eur_to_dkk_rate') eurToDkkRate = Number(s.value) || 7.46
    }
  }

  return { globalMargin, eurToDkkRate }
}

// EUR sell price -> final DKK price (rounded to 2 decimals).
export function calculateFinalPrice(
  sellPriceEur: number,
  productMargin: number | null,
  settings: StoreSettings,
): number {
  const margin = productMargin ?? settings.globalMargin
  const dkk = sellPriceEur * (1 + margin / 100) * settings.eurToDkkRate
  return Math.round(dkk * 100) / 100
}

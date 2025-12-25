import { supabase } from '@/integrations/supabase/client';

export interface KinguinProduct {
  id: string;
  kinguin_id: number;
  product_id: string | null;
  name: string;
  description: string | null;
  cover_image: string | null;
  screenshots: string[] | null;
  original_price: number;
  sell_price: number;
  platform: string | null;
  genres: string[] | null;
  release_date: string | null;
  region_id: number | null;
  region_name: string | null;
  is_available: boolean;
  qty: number;
}

export async function fetchKinguinProducts(limit = 20, searchQuery?: string): Promise<KinguinProduct[]> {
  let query = supabase
    .from('kinguin_products')
    .select('*')
    .eq('is_available', true)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (searchQuery) {
    query = query.ilike('name', `%${searchQuery}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching Kinguin products:', error);
    throw error;
  }

  return (data || []) as KinguinProduct[];
}

export async function fetchKinguinProductById(kinguinId: number): Promise<KinguinProduct | null> {
  const { data, error } = await supabase
    .from('kinguin_products')
    .select('*')
    .eq('kinguin_id', kinguinId)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }

  return data as KinguinProduct;
}

export async function syncProducts(
  syncToShopify = true,
  startPage = 1,
  onProgress?: (page: number, totalSynced: number) => void
): Promise<{ success: boolean; synced: number; shopifySynced: number }> {
  let totalSynced = 0;
  let totalShopifySynced = 0;
  let page = startPage;
  const limit = 100;
  
  // Sync ALL pages until Kinguin returns fewer products than requested
  while (true) {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kinguin-sync-products?page=${page}&limit=${limit}&syncToShopify=${syncToShopify}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`Sync error on page ${page}:`, await response.text());
      break;
    }

    const result = await response.json();
    const syncedThisPage = result.synced || 0;
    totalSynced += syncedThisPage;
    totalShopifySynced += result.shopifySynced || 0;
    
    console.log(`Page ${page}: synced ${syncedThisPage} products (total: ${totalSynced})`);
    
    // Report progress
    onProgress?.(page, totalSynced);
    
    // Stop if we got fewer products than requested (no more pages)
    if (syncedThisPage < limit) {
      break;
    }
    
    page++;
  }

  return { success: true, synced: totalSynced, shopifySynced: totalShopifySynced };
}

export async function syncDbToShopify(
  startOffset = 0,
  onProgress?: (nextOffset: number, totalSynced: number) => void
): Promise<{ success: boolean; synced: number }> {
  const OFFSET_KEY = 'kinguin_shopify_sync_offset';
  const IN_PROGRESS_KEY = 'kinguin_shopify_sync_in_progress';

  const persistSet = (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  };

  const persistRemove = (key: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  };

  let totalSynced = 0;
  let offset = startOffset;
  const limit = 50; // Smaller batches for Shopify API rate limits

  persistSet(IN_PROGRESS_KEY, 'true');
  persistSet(OFFSET_KEY, String(offset));

  while (true) {
    // Persist before each request so refreshes can resume safely
    persistSet(OFFSET_KEY, String(offset));

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-db-to-shopify?offset=${offset}&limit=${limit}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`Sync error at offset ${offset}:`, await response.text());
      // Leave persisted offset + in-progress flag so we can resume later
      break;
    }

    const result = await response.json();
    const syncedThisBatch = result.synced || 0;
    totalSynced += syncedThisBatch;

    const nextOffset: number = result.nextOffset ?? offset + limit;

    console.log(`Offset ${offset}: synced ${syncedThisBatch} to Shopify (total: ${totalSynced})`);

    // Report the NEXT offset (where we will resume from)
    onProgress?.(nextOffset, totalSynced);
    persistSet(OFFSET_KEY, String(nextOffset));

    if (result.done) {
      persistRemove(IN_PROGRESS_KEY);
      persistRemove(OFFSET_KEY);
      break;
    }

    offset = nextOffset;
  }

  return { success: true, synced: totalSynced };
}

export interface CartItem {
  kinguinId: number;
  name: string;
  price: number; // Original Kinguin price
  sellPrice: number; // Price with margin
  qty: number;
  coverImage?: string;
}

export async function placeOrder(items: CartItem[], email: string): Promise<{ orderId: string; status: string }> {
  const { data, error } = await supabase.functions.invoke('kinguin-place-order', {
    body: {
      products: items.map(item => ({
        kinguinId: item.kinguinId,
        price: item.price,
        qty: item.qty
      })),
      email
    }
  });

  if (error) {
    console.error('Error placing order:', error);
    throw error;
  }

  return data;
}

export async function getOrder(orderId: string) {
  const { data, error } = await supabase.functions.invoke('kinguin-get-order', {
    body: {},
  });

  if (error) {
    console.error('Error getting order:', error);
    throw error;
  }

  return data;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
}

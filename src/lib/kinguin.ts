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

export async function syncProducts(syncToShopify = true): Promise<{ success: boolean; synced: number; shopifySynced: number }> {
  let totalSynced = 0;
  let totalShopifySynced = 0;
  
  // Sync multiple pages to get more products
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.functions.invoke('kinguin-sync-products', {
      body: {},
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Pass params via URL since edge function reads from query params
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kinguin-sync-products?page=${page}&limit=100&syncToShopify=${syncToShopify}`,
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
    totalSynced += result.synced || 0;
    totalShopifySynced += result.shopifySynced || 0;
    
    // Stop if we got fewer products than requested (no more pages)
    if ((result.synced || 0) < 100) {
      break;
    }
  }

  return { success: true, synced: totalSynced, shopifySynced: totalShopifySynced };
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

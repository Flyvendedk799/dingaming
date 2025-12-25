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

export async function syncProducts(): Promise<{ success: boolean; synced: number }> {
  const { data, error } = await supabase.functions.invoke('kinguin-sync-products', {
    body: {}
  });

  if (error) {
    console.error('Error syncing products:', error);
    throw error;
  }

  return data;
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

import { supabase } from '@/integrations/supabase/client';

export interface KinguinProduct {
  id: string;
  kinguin_id: number;
  product_id?: string | null;
  name: string;
  description?: string | null;
  cover_image: string | null;
  screenshots?: string[] | null;
  original_price: number;
  sell_price: number;
  platform: string | null;
  genres: string[] | null;
  release_date?: string | null;
  region_id?: number | null;
  region_name?: string | null;
  is_available: boolean | null;
  qty: number | null;
  margin_percent: number | null;
  shopify_product_id?: string | null;
  last_synced_to_shopify?: string | null;
  is_featured?: boolean | null;
  is_on_sale?: boolean | null;
  sale_label?: string | null;
}

// Only select columns needed for display (faster query)
const PRODUCT_LIST_COLUMNS = `
  id,
  kinguin_id,
  product_id,
  name,
  cover_image,
  original_price,
  sell_price,
  platform,
  genres,
  is_available,
  qty,
  margin_percent,
  is_featured,
  is_on_sale,
  sale_label
`;

export interface ProductListOptions {
  /**
   * Hide products with no cover art.
   *
   * Roughly a tenth of the Kinguin catalogue comes back without artwork, which
   * looks broken in a grid. Discovery surfaces (home, deals) set this so they
   * only show products that look presentable. Search and category browsing
   * leave it off: someone who asked for a specific title should find it.
   */
  requireCoverImage?: boolean;
}

export async function fetchKinguinProducts(
  limit = 20,
  searchQuery?: string,
  options: ProductListOptions = {},
): Promise<KinguinProduct[]> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let query = supabase
        .from('kinguin_products')
        .select(PRODUCT_LIST_COLUMNS)
        .eq('is_available', true)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      if (options.requireCoverImage) {
        // Missing art is stored as both NULL and '' depending on which Kinguin
        // endpoint the row came from, so both have to be excluded.
        query = query.not('cover_image', 'is', null).neq('cover_image', '');
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []) as KinguinProduct[];
    } catch (error) {
      lastError = error as Error;
      console.warn(`Fetch attempt ${attempt}/${maxRetries} failed:`, error);
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }
  }

  console.error('Error fetching Kinguin products after retries:', lastError);
  throw lastError;
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

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
}

// ---------------------------------------------------------------------------
// Native checkout (replaces the previous Shopify-hosted checkout).
// ---------------------------------------------------------------------------

export interface CheckoutItemInput {
  kinguinId: number;
  quantity: number;
}

export interface CreatedOrder {
  orderId: string;
  orderNumber: string;
  subtotal: number;
  discount: number;
  total: number;
  email: string;
}

export interface DiscountValidation {
  valid: boolean;
  reason?: string;
  code?: string;
  type?: 'percent' | 'fixed';
  value?: number;
  savings: number;
}

/** Validate a discount code for a given subtotal (UX preview; server re-validates). */
export async function validateDiscount(code: string, subtotal: number): Promise<DiscountValidation> {
  const { data, error } = await supabase.functions.invoke('validate-discount', {
    body: { code, subtotal },
  });
  if (error) {
    console.error('validateDiscount error:', error);
    return { valid: false, savings: 0, reason: 'error' };
  }
  return data as DiscountValidation;
}

/**
 * Create a pending order. The server re-prices every line from the catalog,
 * so client-side prices are never trusted.
 */
export async function createOrder(input: {
  items: CheckoutItemInput[];
  email: string;
  customerName?: string;
  discountCode?: string;
}): Promise<CreatedOrder> {
  const { data, error } = await supabase.functions.invoke('create-order', { body: input });
  if (error) {
    // Surface the structured error body when present.
    const message = (data as { error?: string })?.error || error.message || 'Could not create order';
    throw new Error(message);
  }
  if ((data as { error?: string })?.error) {
    throw new Error((data as { error: string }).error);
  }
  return data as CreatedOrder;
}

/**
 * Start payment for an order. With Stripe configured this returns a
 * client_secret to confirm on the client; in local/dev mode the order is paid
 * and fulfilled immediately.
 */
export async function processPayment(orderId: string): Promise<{
  mode: 'stripe' | 'dev' | 'already_paid';
  orderId: string;
  status?: string;
  clientSecret?: string;
  publishableKey?: string | null;
  error?: string;
}> {
  const { data, error } = await supabase.functions.invoke('process-payment', {
    body: { orderId },
  });
  if (error) {
    throw new Error((data as { error?: string })?.error || error.message || 'Payment failed');
  }
  return data;
}

export interface OrderItemRow {
  id: string;
  kinguin_id: number;
  name: string;
  cover_image: string | null;
  platform: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  game_key: string | null;
}

export interface OrderRow {
  id: string;
  order_number: string;
  email: string;
  status: string;
  payment_status: string;
  subtotal: number;
  discount: number;
  discount_code: string | null;
  tax: number;
  total: number;
  currency: string;
  keys: Array<{ productName: string; key: string }> | null;
  created_at: string;
  order_items: OrderItemRow[];
}

// The `orders` / `order_items` tables were added after the committed generated
// types, so we access them through an untyped client and return our own typed
// shapes above. Regenerate types with `supabase gen types` to remove the cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ordersTable = () => (supabase as any).from('orders');

/** Fetch a single order with its items. RLS restricts this to the owner/admin. */
export async function fetchOrderById(orderId: string): Promise<OrderRow | null> {
  const { data, error } = await ordersTable()
    .select('*, order_items(*)')
    .eq('id', orderId)
    .maybeSingle();
  if (error) {
    console.error('fetchOrderById error:', error);
    return null;
  }
  return data as OrderRow | null;
}

/** Fetch the authenticated user's orders with items, newest first. */
export async function fetchMyOrders(): Promise<OrderRow[]> {
  const { data, error } = await ordersTable()
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('fetchMyOrders error:', error);
    return [];
  }
  return (data || []) as OrderRow[];
}

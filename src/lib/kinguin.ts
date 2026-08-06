import { supabase } from '@/integrations/supabase/client';

export interface KinguinProduct {
  id: string;
  kinguin_id: number;
  product_id?: string | null;
  name: string;
  description?: string | null;
  cover_image: string | null;
  screenshots?: string[] | null;
  /** Index-aligned with `screenshots`. Kinguin's newer thumbnail URLs 404, so
   *  treat these as a hint and fall back to the full-size URL on error. */
  screenshot_thumbs?: string[] | null;
  videos?: { id: string; url: string }[] | null;
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
  /**
   * Games only — no prepaid vouchers, software licences or subscriptions.
   *
   * The catalogue carries several thousand of those, and they were dominating
   * the front page. See the `is_game` generated column.
   */
  gamesOnly?: boolean;
  /**
   * Ordering. "fresh" is updated_at, which is churned constantly by Kinguin's
   * product webhook and therefore close to random; "stocked" is the sane
   * default for a curated shelf, because widely-available titles are the
   * mainstream ones.
   */
  order?: "fresh" | "stocked" | "discount" | "cheapest";
  /** Keep out the sub-euro shovelware and the four-figure outliers. */
  priceRange?: { min?: number; max?: number };
  /** Exact genre match against the array column, for related-product shelves. */
  genre?: string;
  /** Substring match, so "PlayStation" catches PlayStation 4 and 5. */
  platform?: string;
  /** Keeps the product you are already looking at out of its own shelf. */
  excludeKinguinId?: number;
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
      const sort = {
        fresh: { column: 'updated_at', ascending: false },
        stocked: { column: 'qty', ascending: false },
        discount: { column: 'discount_percent', ascending: false },
        cheapest: { column: 'sell_price', ascending: true },
      }[options.order ?? 'fresh'];

      // Each conditional filter below re-generics the Supabase builder, and by
      // the fifth one TypeScript gives up with "type instantiation is
      // excessively deep". The chain is held loosely and the row shape is
      // asserted once on the way out.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase
        .from('kinguin_products')
        .select(PRODUCT_LIST_COLUMNS)
        .eq('is_available', true)
        .order(sort.column, { ascending: sort.ascending })
        .limit(limit);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      if (options.requireCoverImage) {
        // Missing art is stored as both NULL and '' depending on which Kinguin
        // endpoint the row came from, so both have to be excluded.
        query = query.not('cover_image', 'is', null).neq('cover_image', '');
      }

      if (options.gamesOnly) {
        query = query.eq('is_game', true);
      }

      if (options.genre) {
        query = query.contains('genres', [options.genre]);
      }

      if (options.platform) {
        query = query.ilike('platform', `%${options.platform}%`);
      }

      if (options.excludeKinguinId !== undefined) {
        query = query.neq('kinguin_id', options.excludeKinguinId);
      }

      if (options.priceRange?.min !== undefined) {
        query = query.gte('sell_price', options.priceRange.min);
      }
      if (options.priceRange?.max !== undefined) {
        query = query.lte('sell_price', options.priceRange.max);
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

/**
 * The selection shown on the front page.
 *
 * Admin-flagged products come first — that is what `is_featured` is for, and
 * it works now that admins can actually write to the catalogue. When nothing
 * is flagged, it falls back to a shelf that at least looks like a games shop:
 * real games with artwork, priced like games rather than like shovelware or
 * four-figure voucher bundles, best-stocked first.
 *
 * It is deliberately NOT ordered by updated_at. Kinguin's product webhook
 * touches thousands of rows an hour, so that ordering made the front page a
 * near-random slice of the catalogue that changed on every reload.
 */
export async function fetchShopfrontProducts(limit = 12): Promise<KinguinProduct[]> {
  const { data: featured } = await supabase
    .from('kinguin_products')
    .select(PRODUCT_LIST_COLUMNS)
    .eq('is_available', true)
    .eq('is_featured', true)
    .not('cover_image', 'is', null)
    .neq('cover_image', '')
    .order('display_order', { ascending: true })
    .limit(limit);

  const curated = (featured ?? []) as unknown as KinguinProduct[];
  if (curated.length >= limit) return curated;

  const fill = await fetchKinguinProducts(limit - curated.length, undefined, {
    requireCoverImage: true,
    gamesOnly: true,
    order: 'stocked',
    priceRange: { min: 5, max: 80 },
  });

  const seen = new Set(curated.map((p) => p.kinguin_id));
  return [...curated, ...fill.filter((p) => !seen.has(p.kinguin_id))].slice(0, limit);
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

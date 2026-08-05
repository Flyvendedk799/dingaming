import { supabase } from '@/integrations/supabase/client';

/**
 * Shared data access for the admin panel.
 *
 * Two things here exist because of bugs that were painful to find:
 *
 * 1. Edge functions are invoked with the *signed-in admin's* token. The panel
 *    used to send the anon publishable key, which identifies nobody — the
 *    admin-only functions now reject that.
 *
 * 2. `mutate()` asks PostgREST to return the affected rows. An UPDATE that RLS
 *    filters out affects zero rows and still answers 204, so a blocked write
 *    looked exactly like a successful one and the panel cheerfully reported
 *    success. Anything going through here fails loudly instead.
 */

export class AdminApiError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'AdminApiError';
  }
}

async function accessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new AdminApiError('Din session er udløbet. Log ind igen.');
  return token;
}

/** Call an edge function as the signed-in admin. */
export async function callAdminFunction<T = unknown>(
  name: string,
  options: { query?: Record<string, string>; body?: unknown; method?: 'GET' | 'POST' } = {},
): Promise<T> {
  const token = await accessToken();
  const base = import.meta.env.VITE_SUPABASE_URL;
  const qs = options.query ? `?${new URLSearchParams(options.query)}` : '';

  const res = await fetch(`${base}/functions/v1/${name}${qs}`, {
    method: options.method ?? 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Content-Type': 'application/json',
    },
    body: options.method === 'GET' ? undefined : JSON.stringify(options.body ?? {}),
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401) throw new AdminApiError('Ikke logget ind som admin.');
    if (res.status === 403) throw new AdminApiError('Du har ikke admin-rettigheder.');
    throw new AdminApiError((payload as { error?: string })?.error ?? `Kaldet fejlede (${res.status})`);
  }
  return payload as T;
}

/**
 * Run a write and confirm it actually changed something.
 *
 * Pass a builder that already has `.select()` on it so PostgREST returns the
 * rows it touched; an empty result means RLS silently dropped the write.
 */
export async function mutate<T>(
  builder: PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  what: string,
): Promise<T[]> {
  const { data, error } = await builder;
  if (error) throw new AdminApiError(`${what} fejlede: ${error.message}`, error);
  if (!data || data.length === 0) {
    throw new AdminApiError(
      `${what} blev ikke gemt — databasen afviste ændringen. Er du logget ind som admin?`,
    );
  }
  return data;
}

// ---------------------------------------------------------------------------
// Customer orders. `orders` / `order_items` are missing from the generated
// types, so they go through an untyped client (see src/lib/kinguin.ts).
// ---------------------------------------------------------------------------

export interface AdminOrderItem {
  id: string;
  kinguin_id: number;
  name: string;
  cover_image: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  game_key: string | null;
}

export interface AdminOrder {
  id: string;
  order_number: string;
  email: string;
  customer_name: string | null;
  status: string;
  payment_status: string;
  payment_provider: string | null;
  payment_ref: string | null;
  currency: string;
  subtotal: number;
  discount: number;
  discount_code: string | null;
  total: number;
  shards_awarded: number | null;
  kinguin_order_id: string | null;
  keys: Array<{ productName: string; key: string }> | null;
  error_message: string | null;
  created_at: string;
  order_items: AdminOrderItem[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const untyped = () => supabase as any;

export interface OrderQuery {
  status?: string;
  search?: string;
  limit?: number;
}

export async function fetchAdminOrders(query: OrderQuery = {}): Promise<AdminOrder[]> {
  let q = untyped()
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
    .limit(query.limit ?? 100);

  if (query.status && query.status !== 'all') q = q.eq('status', query.status);
  if (query.search?.trim()) {
    const term = query.search.trim();
    q = q.or(`email.ilike.%${term}%,order_number.ilike.%${term}%`);
  }

  const { data, error } = await q;
  if (error) throw new AdminApiError(`Kunne ikke hente ordrer: ${error.message}`, error);
  return (data ?? []) as AdminOrder[];
}

export interface OrderTotals {
  count: number;
  revenue: number;
  failed: number;
  awaitingKeys: number;
}

export function summariseOrders(orders: AdminOrder[]): OrderTotals {
  return orders.reduce<OrderTotals>(
    (acc, o) => {
      acc.count += 1;
      // Only money that actually settled counts as revenue.
      if (o.payment_status === 'paid') acc.revenue += Number(o.total) || 0;
      if (o.status === 'failed') acc.failed += 1;
      if (o.status === 'fulfilling') acc.awaitingKeys += 1;
      return acc;
    },
    { count: 0, revenue: 0, failed: 0, awaitingKeys: 0 },
  );
}

// ---------------------------------------------------------------------------
// Discount codes
// ---------------------------------------------------------------------------

export interface DiscountCode {
  id: string;
  code: string;
  type: string;
  value: number;
  min_subtotal: number | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export async function fetchDiscountCodes(): Promise<DiscountCode[]> {
  const { data, error } = await untyped()
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new AdminApiError(`Kunne ikke hente rabatkoder: ${error.message}`, error);
  return (data ?? []) as DiscountCode[];
}

export async function saveDiscountCode(
  input: Partial<DiscountCode> & { code: string; type: string; value: number },
): Promise<DiscountCode> {
  const row = {
    code: input.code.trim().toUpperCase(),
    type: input.type,
    value: input.value,
    min_subtotal: input.min_subtotal ?? 0,
    max_uses: input.max_uses ?? null,
    is_active: input.is_active ?? true,
    expires_at: input.expires_at ?? null,
  };

  const builder = input.id
    ? untyped().from('discount_codes').update(row).eq('id', input.id).select()
    : untyped().from('discount_codes').insert(row).select();

  const [saved] = await mutate<DiscountCode>(builder, 'Rabatkoden');
  return saved;
}

export async function setDiscountCodeActive(id: string, isActive: boolean): Promise<void> {
  await mutate(
    untyped().from('discount_codes').update({ is_active: isActive }).eq('id', id).select(),
    isActive ? 'Aktivering' : 'Deaktivering',
  );
}

export async function deleteDiscountCode(id: string): Promise<void> {
  await mutate(untyped().from('discount_codes').delete().eq('id', id).select(), 'Sletning');
}

// ---------------------------------------------------------------------------
// Store settings + catalogue/sync health
// ---------------------------------------------------------------------------

export async function saveStoreSetting(key: string, value: unknown): Promise<void> {
  await mutate(
    untyped().from('store_settings').update({ value }).eq('key', key).select(),
    'Indstillingen',
  );
}

export interface SyncLock {
  locked: boolean;
  started_at: string | null;
  function: string | null;
}

export interface CatalogueHealth {
  total: number;
  available: number;
  /** Hidden from the home page and deals because they have no artwork. */
  missingArtwork: number;
  onSale: number;
  featured: number;
  lastSync: string | null;
  lock: SyncLock;
  backfillComplete: boolean;
}

export async function fetchCatalogueHealth(): Promise<CatalogueHealth> {
  const countOf = async (apply?: (q: any) => any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    let q = untyped().from('kinguin_products').select('kinguin_id', { count: 'exact', head: true });
    if (apply) q = apply(q);
    const { count, error } = await q;
    if (error) throw new AdminApiError(`Kunne ikke tælle produkter: ${error.message}`, error);
    return count ?? 0;
  };

  const [total, available, withArt, onSale, featured, settings] = await Promise.all([
    countOf(),
    countOf((q) => q.eq('is_available', true)),
    countOf((q) => q.eq('is_available', true).not('cover_image', 'is', null).neq('cover_image', '')),
    countOf((q) => q.eq('is_on_sale', true)),
    countOf((q) => q.eq('is_featured', true)),
    untyped().from('store_settings').select('key, value'),
  ]);

  const byKey: Record<string, unknown> = {};
  for (const row of (settings.data ?? []) as Array<{ key: string; value: unknown }>) {
    byKey[row.key] = row.value;
  }

  const rawLock = byKey['sync_lock'];
  const lock: SyncLock =
    rawLock && typeof rawLock === 'object'
      ? (rawLock as SyncLock)
      : { locked: false, started_at: null, function: null };

  const rawSync = byKey['last_kinguin_sync_timestamp'];
  const lastSync = typeof rawSync === 'string' ? rawSync.replace(/^"+|"+$/g, '') : null;

  return {
    total,
    available,
    missingArtwork: available - withArt,
    onSale,
    featured,
    lastSync: lastSync && lastSync !== '2020-01-01T00:00:00Z' ? lastSync : null,
    lock,
    backfillComplete: byKey['backfill_complete'] === true || byKey['backfill_complete'] === 'true',
  };
}

/** Clear a lock left behind by a sync run that died mid-flight. */
export async function clearSyncLock(): Promise<void> {
  await saveStoreSetting('sync_lock', { locked: false, started_at: null, function: null });
}

export interface WebhookLog {
  id: string;
  event_type: string;
  payload: unknown;
  processed_at: string;
}

export async function fetchWebhookLogs(limit = 25): Promise<WebhookLog[]> {
  const { data, error } = await untyped()
    .from('kinguin_webhook_logs')
    .select('*')
    .order('processed_at', { ascending: false })
    .limit(limit);
  if (error) throw new AdminApiError(`Kunne ikke hente webhook-log: ${error.message}`, error);
  return (data ?? []) as WebhookLog[];
}

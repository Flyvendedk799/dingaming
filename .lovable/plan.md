

# Full Purchase Flow — Gap Analysis & Implementation Plan

## Current State

The purchase pipeline has these pieces already built:

1. **Cart → Shopify Checkout**: Works. Customer adds items, goes to Shopify checkout, pays.
2. **Shopify `orders/paid` webhook → Kinguin order placement**: Edge function `shopify-order-webhook` receives Shopify webhook, matches SKUs (`KINGUIN-{id}`), places order with Kinguin API, saves to `kinguin_orders` table.
3. **Kinguin webhook → Key storage**: Edge function `kinguin-webhook` handles `order.status` events, stores keys in `kinguin_orders.keys` when status is `completed`.
4. **Admin panel**: Can view orders and keys.
5. **Key download/return**: Edge functions `kinguin-keys` and `kinguin-get-order` exist.

## Identified Gaps

### Critical (customer cannot receive their product)

| # | Gap | Impact |
|---|-----|--------|
| 1 | **No Shopify webhook registration** | The `shopify-order-webhook` function exists but there is no code registering it with Shopify. Orders/paid events are never sent. The entire backend pipeline never triggers. |
| 2 | **No key delivery to customer** | Even if keys arrive in the DB, there is no email sent and no customer-facing page to view keys. |
| 3 | **No "My Orders" page** | Logged-in customers have no way to see their order history or retrieve game keys. |
| 4 | **`kinguin_orders` has no `user_id` column** | Orders are linked by `user_email` only. There's no foreign key to tie orders to authenticated users for a My Orders page query. |

### Important (reliability)

| # | Gap | Impact |
|---|-----|--------|
| 5 | **No idempotency on Shopify webhook** | If Shopify retries the webhook, a duplicate Kinguin order could be placed. |
| 6 | **Kinguin webhook secret validation works, but Shopify webhook has no HMAC validation** | Anyone could POST to the Shopify webhook endpoint. |

## Implementation Plan

### Step 1 — Register Shopify `orders/paid` webhook

Use the Shopify Admin API (`webhookSubscriptionCreate` mutation) to register the `shopify-order-webhook` edge function URL as the callback for `ORDERS_PAID` events. This can be done via a one-time script or a new edge function.

### Step 2 — Add `user_id` to `kinguin_orders`

Database migration to add an optional `user_id uuid` column. Update `shopify-order-webhook` to look up the user by email (same pattern already used for shard awarding) and store the `user_id` on the order row.

### Step 3 — Add idempotency to Shopify webhook

Before placing a Kinguin order, check if `order_external_id = 'shopify_{order.id}'` already exists in `kinguin_orders`. Skip if it does.

### Step 4 — Create "My Orders" page

A new `/orders` route for authenticated users showing:
- Order date, status, products purchased
- Game keys (revealed when status is `completed`)
- Link to re-check status (calls `kinguin-get-order` to refresh)

RLS policy: users can SELECT their own orders via `user_id = auth.uid()`.

### Step 5 — Email key delivery

When the Kinguin webhook marks an order as `completed` with keys, send a transactional email to the customer with their game key(s) and a link to the My Orders page.

### Step 6 — Post-checkout redirect

After Shopify checkout completes, redirect the customer back to the site (e.g., `/orders`) so they know where to find their keys. This uses Shopify's `thank_you_page_url` or a custom return URL on the checkout.

---

## Technical Details

**Webhook registration** — Will use the `shopify--` tools or a `webhookSubscriptionCreate` GraphQL mutation pointing to:
`https://fqwyfpnxyvlrofswosfm.supabase.co/functions/v1/shopify-order-webhook`

**Database migration** — `ALTER TABLE kinguin_orders ADD COLUMN user_id uuid;` plus RLS policy for authenticated users to SELECT where `user_id = auth.uid()`.

**Email delivery** — Uses Lovable's built-in transactional email system (scaffold template + `send-transactional-email` invocation from the Kinguin webhook handler).

**Order of implementation**: Steps 1-3 first (make the pipeline actually work), then Steps 4-6 (customer-facing delivery).


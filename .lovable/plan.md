

# Remaining Gaps to Complete the Purchase Flow (Excluding Email)

## Already Done
- Shopify webhook handler with idempotency and user_id linking
- Kinguin webhook for key storage
- My Orders page at `/orders`
- RLS on `kinguin_orders`

## Still Needed

### 1. Register Shopify `orders/paid` Webhook
The `shopify-order-webhook` edge function exists but Shopify doesn't know about it. Need to register the webhook URL so Shopify actually sends `orders/paid` events. This is a one-time Shopify Admin API call using the `webhookSubscriptionCreate` GraphQL mutation.

### 2. Shopify Webhook HMAC Validation
Currently, anyone can POST to the Shopify webhook endpoint. Add HMAC-SHA256 validation using the `X-Shopify-Hmac-Sha256` header and the Shopify webhook secret. Requires storing `SHOPIFY_WEBHOOK_SECRET` as a secret.

### 3. Deploy Updated Edge Functions
The `shopify-order-webhook` was updated (idempotency + user_id) but needs deployment. The `kinguin-webhook` also needs a redeploy if we add email later.

### 4. Product Names in Orders Page
The Orders page currently shows "X produkt(er)" but doesn't display the actual game names. The `products` JSON in `kinguin_orders` only stores `kinguinId`, `qty`, `price` — no product name. Two options:
- **Option A**: Enrich the products JSON at order-creation time (add `name` field from `kinguin_products` table lookup)
- **Option B**: Client-side join — fetch product names from `kinguin_products` using the stored `kinguinId`

Option A is better (data stays self-contained).

### 5. Post-Checkout Redirect / Guidance
After Shopify checkout completes, the customer has no indication they can check `/orders` for keys. Add a thank-you message or redirect. This can be done by:
- Adding a `/thank-you` page that links to `/orders`
- Using Shopify's checkout `return_url` parameter in the Storefront API cart creation

---

## Implementation Summary

| Step | What | Type |
|------|------|------|
| 1 | Register Shopify webhook via Admin API | One-time API call |
| 2 | Add HMAC validation + store webhook secret | Edge function edit + secret |
| 3 | Enrich order products with game names | Edge function edit |
| 4 | Deploy all updated edge functions | Deployment |
| 5 | Post-checkout thank-you page + cart return URL | Frontend |

## Technical Details

**Webhook registration**: Use Shopify Admin API `webhookSubscriptionCreate` mutation targeting `ORDERS_PAID` topic with callback URL `https://fqwyfpnxyvlrofswosfm.supabase.co/functions/v1/shopify-order-webhook`.

**HMAC validation**: In `shopify-order-webhook`, read the raw body, compute HMAC-SHA256 with the webhook secret, compare to `X-Shopify-Hmac-Sha256` header.

**Product name enrichment**: In `handleOrderPaid`, after resolving Kinguin products, query `kinguin_products` for the `name` field and include it in the `products` JSON stored in `kinguin_orders`.

**Thank-you flow**: Update `createStorefrontCheckout` in `shopify.ts` to include a `customAttributes` or `note` with a return URL. Create a simple `/thank-you` page that says "Your order is being processed" with a link to `/orders`.


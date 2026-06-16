# Local development guide

This project runs fully locally — a local Supabase stack plus the Vite dev
server. No hosted services are required to develop or test the end-to-end
purchase flow.

## 1. Start the stack

```sh
npm install
npm run db:start      # supabase start — Postgres, Auth, Studio, Edge Functions
npm run dev           # Vite on http://localhost:8080
```

Useful endpoints once the stack is up (`npm run db:status` prints them):

| Service | URL |
| --- | --- |
| App (Vite) | http://localhost:8080 |
| Supabase API | http://localhost:54321 |
| Supabase Studio | http://localhost:54323 |
| Auth mailbox (Mailpit) | http://localhost:54324 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

`npm run db:reset` drops the database, re-applies every migration in
`supabase/migrations/`, and re-runs `supabase/seed.sql`.

## 2. Frontend environment

`.env` (committed) targets the local stack with the deterministic local demo
anon key, so it works on any machine without changes:

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<local demo anon key>
```

For a hosted deployment, copy `.env.example` and fill in your project values.

## 3. Backend / edge-function secrets

Edge functions read secrets from the environment. For **local** development put
them in `supabase/.env` (git-ignored; see `supabase/.env.example`). The stack
reads this file automatically when serving functions.

| Secret | Used by | Effect when unset (local default) |
| --- | --- | --- |
| `KINGUIN_API_KEY` | catalogue sync, order fulfillment | Fulfillment generates **demo keys** instead of real ones |
| `KINGUIN_WEBHOOK_SECRET` | `kinguin-webhook` | Webhook rejects requests (fine if unused locally) |
| `STRIPE_SECRET_KEY` | `process-payment` | Payment is **simulated** as instantly successful |
| `STRIPE_WEBHOOK_SECRET` | `stripe-webhook` | Signature check skipped (dev only) |
| `STRIPE_PUBLISHABLE_KEY` | returned to client | Client can't mount Stripe Elements |

> Out of the box (no secrets), the full buy → pay → fulfill → keys flow works
> using simulated payment + demo keys. This is intentional so you can develop
> without external accounts.

## 4. The payment seam (connecting Stripe later)

Payments are deliberately abstracted behind one edge function,
`supabase/functions/process-payment`:

- **Dev mode (no `STRIPE_SECRET_KEY`):** the order is marked paid and fulfilled
  immediately, and the client is sent to `/thank-you`.
- **Stripe mode (`STRIPE_SECRET_KEY` set):** it creates a Stripe PaymentIntent
  and returns its `client_secret`. To finish wiring Stripe:
  1. Add `@stripe/stripe-js` + `@stripe/react-stripe-js` to the frontend and
     mount Stripe Elements on the checkout using the returned `client_secret`
     and `publishableKey`.
  2. Configure a Stripe webhook to `…/functions/v1/stripe-webhook` for
     `payment_intent.succeeded` / `payment_intent.payment_failed`. That handler
     already verifies the signature, marks the order paid, and runs fulfillment.

No other code needs to change — `create-order`, fulfillment, shards, and keys
are all payment-provider agnostic.

## 5. Connecting real Kinguin fulfillment

Set `KINGUIN_API_KEY` in `supabase/.env`. Then:

- Sync the catalogue from the admin panel (`/admin` → Synkronisering) or by
  invoking `kinguin-sync-products` / `kinguin-backfill`.
- On a paid order, fulfillment calls Kinguin's `/order` endpoint and stores the
  returned keys. Keys that arrive asynchronously are captured by the
  `kinguin-webhook` function (set `KINGUIN_WEBHOOK_SECRET` and register the
  webhook URL in your Kinguin dashboard).

## 6. Database & types

After changing the schema (new migration), regenerate the typed client:

```sh
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

(The `orders` / `order_items` / `discount_codes` tables are currently accessed
through a small typed wrapper in `src/lib/kinguin.ts`; regenerating types lets
you drop that cast.)

## Troubleshooting

- **Port already in use:** `npm run db:stop` then `npm run db:start`.
- **App shows no products:** ensure the seed ran (`npm run db:reset`), or sync
  from Kinguin with a real `KINGUIN_API_KEY`.
- **Auth emails:** they are captured by Mailpit at http://localhost:54324 —
  nothing is sent externally in local dev.

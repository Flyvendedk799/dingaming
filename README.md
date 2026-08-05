# DinGaming

A digital game-key webshop with a built-in customer club (loyalty shards,
daily streaks, rewards), casino mini-games, and loot-box style shard cases.
Games are sourced from the Kinguin catalogue and orders are fulfilled with real
game keys. Payments run through a Stripe-ready checkout seam.

> This project was originally scaffolded on Lovable and has been migrated to run
> entirely locally: a local Supabase stack (Postgres + Auth + Edge Functions)
> and a Vite dev server. There is no dependency on Lovable or any hosted
> service to develop.

## Tech stack

- **Frontend:** Vite + React 18 + TypeScript, Tailwind + shadcn/ui, Zustand,
  TanStack Query, React Router, Framer Motion
- **Backend:** Supabase (PostgreSQL 15, Auth, Row Level Security, Deno Edge
  Functions)
- **Integrations:** Kinguin (game catalogue + key fulfillment), Stripe
  (payments — seam in place, keys connected later)

## Prerequisites

- [Node.js](https://nodejs.org) 18+ and npm (or [Bun](https://bun.sh))
- [Docker](https://www.docker.com) (for the local Supabase stack)
- [Supabase CLI](https://supabase.com/docs/guides/cli) — `npm i -g supabase`
  or run via `npx supabase`

## Quick start

```sh
# 1. Install dependencies
npm install            # or: bun install

# 2. Start the local Supabase stack (Postgres, Auth, Studio, Edge Functions).
#    Applies all migrations and seeds demo data automatically.
npm run db:start       # wraps `supabase start`

# 3. (optional) Reset the DB and re-run migrations + seed at any time
npm run db:reset

# 4. Start the app
npm run dev            # http://localhost:8080
```

The committed `.env` already points at the local stack using the deterministic
local demo key, so the app works out of the box. Supabase Studio is available
at http://localhost:54323 and the auth mailbox at http://localhost:54324.

### Demo accounts & data

The seed (`supabase/seed.sql`) creates:

- **12 sample games**, 2 shard cases, reward-shop vouchers, and two promo codes
  (`WELCOME10`, `GAMER50`).
- A **demo admin**: `admin@dingaming.dk` / `admin1234` (50,000 shards,
  admin role — visit `/admin`).

You can also sign up for a fresh account at `/signup` (email confirmation is
disabled locally, so you're logged in immediately).

## How it works

### Storefront & checkout
Products live in the local `kinguin_products` table. Browse/search/deals read
straight from there. Checkout is **native and in-app** (`/checkout`):

1. `create-order` re-prices every line from the catalogue (client prices are
   never trusted), validates discounts, and creates a pending order.
2. `process-payment` is the Stripe seam. With `STRIPE_SECRET_KEY` set it creates
   a PaymentIntent; **without** it (default for local dev) it simulates a
   successful payment so the whole flow is testable.
3. On payment, fulfillment places the Kinguin order (if `KINGUIN_API_KEY` is
   configured) or generates demo keys, awards loyalty shards, and burns any
   single-use discount code. Keys appear on `/thank-you` and `/orders`.

See [docs/LOCAL_DEV.md](docs/LOCAL_DEV.md) for the payment/Stripe seam and how to
connect real Kinguin/Stripe keys.

### Customer club
Shards are earned from purchases (1% cashback) and daily logins, spent in the
casino games and shard cases, and redeemed for discount vouchers in the reward
shop. All balances are server-authoritative via `shard_transactions`.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server (port 8080) |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type-check (no emit) |
| `npm run db:start` / `db:stop` | Start / stop the local Supabase stack |
| `npm run db:reset` | Reset DB, re-run migrations + seed |
| `npm run db:status` | Show local Supabase connection details |

## Project layout

```
src/
  components/      UI + feature components (storefront, club, casino, admin)
  pages/           Routed pages
  lib/             kinguin.ts (catalogue + checkout API), pricing.ts
  stores/          Zustand cart store
  contexts/        AuthContext
  integrations/    Supabase client + generated types
supabase/
  migrations/      Database schema (ordered SQL)
  seed.sql         Local demo data
  functions/       Deno edge functions (checkout, fulfillment, club, casino)
  config.toml      Local stack configuration
```

## Deployment

### Self-hosted (current production)

DinGaming runs on the ServerHoster VPS as a `process` service that serves the
built `dist/` with ServerHoster's static server, alongside a **local** Supabase
stack (Postgres + Auth + Edge Functions in Docker) on the same box. There is no
hosted Supabase project and no Lovable dependency.

Deploys are pulled from `main` on GitHub — push, and ServerHoster resets the
clone to the remote, runs `npm run build`, and restarts the service.

Two things must be configured outside the repo:

- **`SUPABASE_AUTH_JWT_SECRET`** — required (see `[auth] jwt_secret` in
  `supabase/config.toml`). Without it the stack falls back to Supabase's
  *published* demo JWT secret, which lets anyone who can reach the API mint a
  `service_role` token and bypass RLS entirely. Generate with
  `openssl rand -hex 32` and put it where `supabase start` will see it.
- **Edge function secrets** — `KINGUIN_API_KEY`, and the Stripe keys once real
  payments are turned on. These live in ServerHoster's encrypted resource
  secrets, which it writes to the functions' env file at start.

### Hosted Supabase (alternative)

1. Create a Supabase project and run `supabase db push` to apply migrations.
2. Set frontend env (`.env`) to your project URL + anon key (see `.env.example`).
3. Deploy functions: `supabase functions deploy` and set secrets
   (`KINGUIN_API_KEY`, `STRIPE_SECRET_KEY`, etc. — see `supabase/.env.example`).

## Payments and fulfillment

`process-payment` creates a real Stripe PaymentIntent when `STRIPE_SECRET_KEY`
is set, and otherwise simulates a successful payment for local development.

Fulfillment places a **real** Kinguin order — spending real merchant balance —
only when the payment actually went through Stripe. A simulated payment always
gets demo keys, so a deployment with a Kinguin key but no Stripe key can't hand
out real game keys for free.

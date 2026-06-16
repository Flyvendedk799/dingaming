-- =====================================================================
-- Native checkout: provider-agnostic orders + order items + discount codes
-- Replaces the previous Shopify-hosted checkout flow. Payment is handled
-- by a Stripe-ready edge function seam (see supabase/functions/process-payment).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text unique not null default ('DG-' || upper(substr(md5(random()::text), 1, 8))),
  user_id           uuid references auth.users(id) on delete set null,
  email             text not null,
  customer_name     text,
  -- order lifecycle: pending -> paid -> fulfilling -> completed | failed | cancelled
  status            text not null default 'pending',
  -- payment lifecycle: unpaid -> paid -> refunded
  payment_status    text not null default 'unpaid',
  payment_provider  text not null default 'stripe',
  payment_ref       text,                       -- e.g. Stripe PaymentIntent id
  currency          text not null default 'DKK',
  subtotal          numeric(10,2) not null default 0,
  discount          numeric(10,2) not null default 0,
  discount_code     text,
  tax               numeric(10,2) not null default 0,
  total             numeric(10,2) not null default 0,
  shards_awarded    integer not null default 0,
  kinguin_order_id  text,
  keys              jsonb not null default '[]'::jsonb,
  error_message     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_orders_user on public.orders(user_id, created_at desc);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_payment_ref on public.orders(payment_ref);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- Order items
-- ---------------------------------------------------------------------
create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  kinguin_id   integer not null,
  name         text not null,
  cover_image  text,
  platform     text,
  unit_price   numeric(10,2) not null,
  quantity     integer not null default 1,
  line_total   numeric(10,2) not null,
  game_key     text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_order_items_order on public.order_items(order_id);

-- ---------------------------------------------------------------------
-- Store-wide discount codes (admin managed). User-specific reward
-- vouchers continue to live in public.user_rewards.voucher_code.
-- ---------------------------------------------------------------------
create table if not exists public.discount_codes (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  -- 'percent' => value is a percentage (0-100); 'fixed' => value is DKK off
  type          text not null default 'percent',
  value         numeric(10,2) not null,
  min_subtotal  numeric(10,2) not null default 0,
  max_uses      integer,                  -- null = unlimited
  used_count    integer not null default 0,
  is_active     boolean not null default true,
  expires_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_discount_codes_code on public.discount_codes(lower(code));

create trigger discount_codes_set_updated_at
  before update on public.discount_codes
  for each row execute function public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.discount_codes enable row level security;

-- Orders: a user can read their own orders; admins can read all.
-- Writes happen exclusively through edge functions using the service role
-- (which bypasses RLS), so no INSERT/UPDATE policies are exposed to clients.
create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Admins can view all orders"
  on public.orders for select
  using (public.has_role(auth.uid(), 'admin'));

-- Order items: visible when the parent order is visible to the user.
create policy "Users can view items of their own orders"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
    )
  );

-- Discount codes: anyone can read active codes (needed for client validation
-- UX); admins manage them.
create policy "Anyone can view active discount codes"
  on public.discount_codes for select
  using (is_active = true);

create policy "Admins can manage discount codes"
  on public.discount_codes for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- Race-free lifetime purchase accumulator (used by order fulfillment).
-- ---------------------------------------------------------------------
create or replace function public.increment_total_purchases(_user_id uuid, _amount numeric)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set total_purchases = coalesce(total_purchases, 0) + _amount,
      updated_at = now()
  where id = _user_id;
$$;

-- ---------------------------------------------------------------------
-- A couple of starter promo codes so the storefront has something to test.
-- ---------------------------------------------------------------------
insert into public.discount_codes (code, type, value, min_subtotal, is_active)
values
  ('WELCOME10', 'percent', 10, 0, true),
  ('GAMER50',   'fixed',   50, 200, true)
on conflict (code) do nothing;

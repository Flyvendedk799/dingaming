-- =====================================================================
-- Local development seed data for DinGaming.
-- Runs automatically on `supabase db reset` (see config.toml [db.seed]).
-- Safe to re-run: uses ON CONFLICT guards where unique constraints exist.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Sample catalog (normally populated from Kinguin via kinguin-sync).
-- Prices are in EUR; the storefront converts to DKK with the configured
-- margin + exchange rate from store_settings.
-- ---------------------------------------------------------------------
insert into public.kinguin_products
  (kinguin_id, product_id, name, description, cover_image, screenshots,
   original_price, sell_price, platform, genres, release_date, region_id,
   region_name, is_available, qty, is_featured, is_on_sale, sale_label)
values
  (100001, 'pid-100001', 'Cyber Odyssey 2099',
   'An open-world cyberpunk RPG set in a sprawling neon metropolis. Hack, fight and choose your path.',
   'https://picsum.photos/seed/cyber2099/600/800', '{}',
   59.99, 39.99, 'Steam', '{"RPG","Action","Open World"}', '2024-11-12', 3, 'Worldwide', true, 120, true, true, 'HOT DEAL'),
  (100002, 'pid-100002', 'Galactic Frontier',
   'Command your fleet across a procedurally generated galaxy in this 4X space strategy epic.',
   'https://picsum.photos/seed/galactic/600/800', '{}',
   49.99, 44.99, 'Steam', '{"Strategy","Sci-Fi"}', '2024-08-03', 3, 'Worldwide', true, 64, true, false, null),
  (100003, 'pid-100003', 'Shadow Realms: Awakening',
   'A dark fantasy soulslike where every death teaches you something new.',
   'https://picsum.photos/seed/shadow/600/800', '{}',
   69.99, 54.99, 'PlayStation', '{"Action","RPG","Souls-like"}', '2025-02-20', 1, 'Europe', true, 40, true, true, '-21%'),
  (100004, 'pid-100004', 'Pixel Racers Turbo',
   'Retro-styled arcade racing with online multiplayer and a killer synthwave soundtrack.',
   'https://picsum.photos/seed/pixelracers/600/800', '{}',
   24.99, 14.99, 'Steam', '{"Racing","Arcade","Multiplayer"}', '2023-05-18', 3, 'Worldwide', true, 200, false, true, '-40%'),
  (100005, 'pid-100005', 'Kingdoms of Eldoria',
   'Build, trade and conquer in a medieval grand strategy sandbox.',
   'https://picsum.photos/seed/eldoria/600/800', '{}',
   39.99, 29.99, 'Steam', '{"Strategy","Simulation"}', '2024-01-30', 3, 'Worldwide', true, 88, false, false, null),
  (100006, 'pid-100006', 'Neon Brawlers',
   'Fast-paced 1v1 fighting game with rollback netcode and a roster of 24 fighters.',
   'https://picsum.photos/seed/neonbrawl/600/800', '{}',
   34.99, 27.99, 'Xbox', '{"Fighting","Multiplayer"}', '2024-09-09', 1, 'Europe', true, 55, true, false, null),
  (100007, 'pid-100007', 'Frostbite Survival',
   'Survive the endless winter. Craft, hunt and build shelter against the cold and the dark.',
   'https://picsum.photos/seed/frostbite/600/800', '{}',
   29.99, 19.99, 'Steam', '{"Survival","Crafting","Open World"}', '2023-11-02', 3, 'Worldwide', true, 150, false, true, '-33%'),
  (100008, 'pid-100008', 'Mystic Tactics',
   'A turn-based tactics game with deep job systems and a sweeping story.',
   'https://picsum.photos/seed/mystic/600/800', '{}',
   44.99, 34.99, 'Nintendo Switch', '{"Strategy","RPG","Turn-Based"}', '2024-06-14', 3, 'Worldwide', true, 30, false, false, null),
  (100009, 'pid-100009', 'Velocity Heist',
   'Pull off the perfect getaway in this co-op heist shooter.',
   'https://picsum.photos/seed/heist/600/800', '{}',
   39.99, 32.99, 'Steam', '{"Action","Shooter","Co-op"}', '2025-01-08', 3, 'Worldwide', true, 70, true, false, null),
  (100010, 'pid-100010', 'Garden of Dreams',
   'A cozy life-sim about restoring an enchanted garden and befriending the villagers.',
   'https://picsum.photos/seed/garden/600/800', '{}',
   19.99, 16.99, 'Nintendo Switch', '{"Simulation","Casual","Indie"}', '2024-03-22', 3, 'Worldwide', true, 110, false, false, null),
  (100011, 'pid-100011', 'Abyssal Depths',
   'Dive into a Lovecraftian underwater horror where the pressure is the least of your worries.',
   'https://picsum.photos/seed/abyssal/600/800', '{}',
   27.99, 21.99, 'PlayStation', '{"Horror","Adventure"}', '2024-10-31', 1, 'Europe', true, 45, true, true, 'SPOOKY'),
  (100012, 'pid-100012', 'Hyperline Drift',
   'Anti-gravity combat racing at 1000 km/h. Weapons hot.',
   'https://picsum.photos/seed/hyperline/600/800', '{}',
   32.99, 22.99, 'Steam', '{"Racing","Action","Sci-Fi"}', '2023-07-19', 3, 'Worldwide', true, 95, false, true, '-30%')
on conflict (kinguin_id) do nothing;

-- ---------------------------------------------------------------------
-- Shard cases (loot boxes) referencing the seeded catalog.
-- ---------------------------------------------------------------------
insert into public.shard_cases (id, name, description, image_url, calculated_price, is_active, display_order)
values
  ('aaaaaaa1-0000-0000-0000-000000000001', 'Starter Case',
   'A great first case packed with indie gems and the occasional blockbuster.',
   'https://picsum.photos/seed/startercase/400/400', 5000, true, 1),
  ('aaaaaaa1-0000-0000-0000-000000000002', 'Premium Case',
   'High roller territory. Big-budget titles with rare drop chances.',
   'https://picsum.photos/seed/premiumcase/400/400', 25000, true, 2)
on conflict (id) do nothing;

insert into public.shard_case_items (case_id, kinguin_product_id, drop_percentage)
select c.case_id, p.id, c.drop
from (values
  ('aaaaaaa1-0000-0000-0000-000000000001'::uuid, 100004, 35.0),
  ('aaaaaaa1-0000-0000-0000-000000000001'::uuid, 100010, 30.0),
  ('aaaaaaa1-0000-0000-0000-000000000001'::uuid, 100007, 20.0),
  ('aaaaaaa1-0000-0000-0000-000000000001'::uuid, 100012, 12.0),
  ('aaaaaaa1-0000-0000-0000-000000000001'::uuid, 100001, 3.0),
  ('aaaaaaa1-0000-0000-0000-000000000002'::uuid, 100002, 30.0),
  ('aaaaaaa1-0000-0000-0000-000000000002'::uuid, 100009, 28.0),
  ('aaaaaaa1-0000-0000-0000-000000000002'::uuid, 100006, 22.0),
  ('aaaaaaa1-0000-0000-0000-000000000002'::uuid, 100003, 12.0),
  ('aaaaaaa1-0000-0000-0000-000000000002'::uuid, 100001, 8.0)
) as c(case_id, kinguin_id, drop)
join public.kinguin_products p on p.kinguin_id = c.kinguin_id
where not exists (
  select 1 from public.shard_case_items s
  where s.case_id = c.case_id and s.kinguin_product_id = p.id
);

-- ---------------------------------------------------------------------
-- Reward shop items (in case migrations left it empty).
-- ---------------------------------------------------------------------
insert into public.reward_items (name, description, type, shard_cost, value_dkk, stock, is_active)
values
  ('25 kr Voucher', 'Get 25 DKK off your next order.', 'voucher', 2500, 25, null, true),
  ('50 kr Voucher', 'Get 50 DKK off your next order.', 'voucher', 4500, 50, null, true),
  ('100 kr Voucher', 'Get 100 DKK off your next order.', 'voucher', 8500, 100, 50, true)
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Demo admin account for local development.
--   email:    admin@dingaming.dk
--   password: admin1234
-- The handle_new_user trigger creates the matching profile + shard_balance.
-- ---------------------------------------------------------------------
do $$
declare
  admin_id uuid := 'd0d0d0d0-0000-0000-0000-0000000000ad';
begin
  if not exists (select 1 from auth.users where email = 'admin@dingaming.dk') then
    insert into auth.users
      (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
       confirmation_token, recovery_token, email_change_token_new, email_change)
    values
      ('00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
       'admin@dingaming.dk', crypt('admin1234', gen_salt('bf')), now(),
       now(), now(), '{"provider":"email","providers":["email"]}',
       '{"display_name":"Admin"}', '', '', '', '');

    insert into auth.identities
      (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values
      (admin_id::text, admin_id,
       format('{"sub":"%s","email":"%s"}', admin_id, 'admin@dingaming.dk')::jsonb,
       'email', now(), now(), now());

    -- Grant the admin role.
    insert into public.user_roles (user_id, role) values (admin_id, 'admin')
    on conflict do nothing;

    -- Give the demo admin a generous shard balance to exercise the club/casino.
    insert into public.shard_transactions (user_id, amount, type, description)
    values (admin_id, 50000, 'purchase_shards', 'Seed: welcome bundle');
  end if;
end $$;

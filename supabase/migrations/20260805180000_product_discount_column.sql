-- A real "largest discount first" sort.
--
-- The category page's default ordering is by saving, and discount is derived
-- from two columns rather than stored, so PostgREST could not order by it.
-- Sorting a single fetched page client-side would have produced an ordering
-- that silently broke across pagination, so the value is materialised instead.
--
-- Generated and stored, so the sync keeps it correct for free: it recomputes
-- whenever either price is written and can never drift from them.

ALTER TABLE public.kinguin_products
  ADD COLUMN IF NOT EXISTS discount_percent integer
  GENERATED ALWAYS AS (
    CASE
      WHEN original_price IS NULL OR sell_price IS NULL THEN 0
      WHEN original_price <= 0 THEN 0
      WHEN original_price <= sell_price THEN 0
      ELSE floor((1 - (sell_price / original_price)) * 100)::integer
    END
  ) STORED;

-- Serves both the default sort and the "on sale" filter, which uses a genuine
-- price difference rather than the admin-curated is_on_sale flag.
CREATE INDEX IF NOT EXISTS idx_kinguin_products_discount
  ON public.kinguin_products (discount_percent DESC)
  WHERE is_available = true;

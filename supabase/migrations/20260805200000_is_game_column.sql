-- Tell games apart from gift cards.
--
-- Kinguin's catalogue is not only games. Alongside 25,000 real titles it
-- carries prepaid vouchers (Rewarble PayPal, Bol.com, MasterCard), software
-- licences and subscriptions. Because the storefront ordered by updated_at and
-- Kinguin's product webhook touches ~3,700 rows an hour, the front page was
-- showing whichever rows had just been poked — in practice a wall of
-- gift cards, including a EUR 323 Paysera voucher, on a shop that sells games.
--
-- Three signals separate them, and the first is the strongest: every real game
-- carries genres, and no voucher does.

ALTER TABLE public.kinguin_products
  ADD COLUMN IF NOT EXISTS is_game boolean
  GENERATED ALWAYS AS (
    coalesce(array_length(genres, 1), 0) > 0
    AND platform IS NOT NULL
    AND (
      lower(platform) LIKE '%steam%'
      OR lower(platform) LIKE '%playstation%'
      OR lower(platform) LIKE '%xbox%'
      OR lower(platform) LIKE '%nintendo%'
      OR lower(platform) LIKE '%gog%'
      OR lower(platform) LIKE '%epic%'
      OR lower(platform) LIKE '%ea app%'
      OR lower(platform) LIKE '%ubisoft%'
      OR lower(platform) LIKE '%battle%'
    )
    -- A handful of vouchers carry genres anyway, so exclude them by name too.
    AND lower(name) NOT LIKE '%gift card%'
    AND lower(name) NOT LIKE '%rewarble%'
    AND lower(name) NOT LIKE '%subscription%'
    AND lower(name) NOT LIKE '% balance%'
    AND lower(name) NOT LIKE '%wallet%'
    AND lower(name) NOT LIKE '%gems%'
    AND lower(name) NOT LIKE '%diamonds%'
  ) STORED;

-- The storefront's hot path: buyable games with artwork, best-stocked first.
CREATE INDEX IF NOT EXISTS idx_kinguin_products_shopfront
  ON public.kinguin_products (qty DESC)
  WHERE is_available = true AND is_game = true;

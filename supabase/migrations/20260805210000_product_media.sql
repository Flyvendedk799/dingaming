-- Per-product media.
--
-- Kinguin returns screenshots under `images.screenshots[]` (each with a `url`
-- and a `thumbnail`) and a YouTube trailer under `videos[]`. The sync mapped
-- `product.screenshots`, which is not a field the API returns, so the
-- screenshots column shipped empty for all 33,750 rows and every product page
-- showed a single cover image. Videos were never captured at all.
--
-- Thumbnails are stored in a parallel array rather than folding screenshots
-- into jsonb, so the existing text[] consumers keep working unchanged.
alter table public.kinguin_products
  add column if not exists screenshot_thumbs text[] not null default '{}',
  add column if not exists videos jsonb not null default '[]'::jsonb;

comment on column public.kinguin_products.screenshot_thumbs is
  'Thumbnail URLs, same order as screenshots. Kinguin''s newer cdn-cgi/image thumbnail URLs return 404, so the UI treats these as a hint and falls back to the full-size URL on error.';

comment on column public.kinguin_products.videos is
  'YouTube trailers as [{"id","url"}]. Roughly 96% of products carry one.';

-- Lets discovery surfaces prefer products that actually have a gallery.
create index if not exists kinguin_products_has_media_idx
  on public.kinguin_products ((array_length(screenshots, 1)))
  where is_available and array_length(screenshots, 1) > 0;

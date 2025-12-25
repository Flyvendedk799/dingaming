-- Track backfill progress
INSERT INTO public.store_settings (key, value)
VALUES ('backfill_last_page', '1'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.store_settings (key, value)
VALUES ('backfill_complete', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
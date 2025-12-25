-- Add sync lock tracking
INSERT INTO public.store_settings (key, value)
VALUES ('sync_lock', '{"locked": false, "started_at": null, "function": null}'::jsonb)
ON CONFLICT (key) DO NOTHING;
-- Add sync state tracking
INSERT INTO public.store_settings (key, value)
VALUES ('last_kinguin_sync_timestamp', '"2020-01-01T00:00:00Z"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Add auto_sync_enabled setting
INSERT INTO public.store_settings (key, value)
VALUES ('auto_sync_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Add sync_interval_minutes setting (default 60 = hourly)
INSERT INTO public.store_settings (key, value)
VALUES ('sync_interval_minutes', '60'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net for HTTP calls from cron
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
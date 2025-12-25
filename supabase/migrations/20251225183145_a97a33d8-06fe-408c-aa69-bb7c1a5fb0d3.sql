-- Add margin column to kinguin_products (per-product override)
ALTER TABLE public.kinguin_products 
ADD COLUMN IF NOT EXISTS margin_percent numeric DEFAULT NULL;

-- Add shopify_product_id to track Shopify link
ALTER TABLE public.kinguin_products 
ADD COLUMN IF NOT EXISTS shopify_product_id text DEFAULT NULL;

-- Add last_synced_to_shopify timestamp
ALTER TABLE public.kinguin_products 
ADD COLUMN IF NOT EXISTS last_synced_to_shopify timestamp with time zone DEFAULT NULL;

-- Create settings table for global configuration
CREATE TABLE IF NOT EXISTS public.store_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to settings (non-sensitive config)
CREATE POLICY "Settings are publicly readable" 
ON public.store_settings 
FOR SELECT 
USING (true);

-- Insert default global margin (30%)
INSERT INTO public.store_settings (key, value)
VALUES ('global_margin_percent', '30'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Insert EUR to DKK exchange rate (can be updated via webhook or manually)
INSERT INTO public.store_settings (key, value)
VALUES ('eur_to_dkk_rate', '7.46'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_kinguin_products_shopify_id ON public.kinguin_products (shopify_product_id);

-- Trigger for updated_at on store_settings
CREATE TRIGGER update_store_settings_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Add index to speed up the common product listing query
CREATE INDEX IF NOT EXISTS idx_kinguin_products_available_updated 
ON public.kinguin_products (is_available, updated_at DESC)
WHERE is_available = true;

-- Add index for featured products
CREATE INDEX IF NOT EXISTS idx_kinguin_products_featured
ON public.kinguin_products (is_featured, updated_at DESC)
WHERE is_featured = true AND is_available = true;
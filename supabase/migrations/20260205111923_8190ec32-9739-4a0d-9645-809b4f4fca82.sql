-- Add product management columns to kinguin_products
ALTER TABLE public.kinguin_products 
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_on_sale boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sale_label text,
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Create product bundles table
CREATE TABLE public.product_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  cover_image text,
  discount_percent numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create bundle items junction table
CREATE TABLE public.bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid REFERENCES public.product_bundles(id) ON DELETE CASCADE NOT NULL,
  kinguin_product_id uuid REFERENCES public.kinguin_products(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(bundle_id, kinguin_product_id)
);

-- Create indexes for performance
CREATE INDEX idx_kinguin_products_is_featured ON public.kinguin_products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_kinguin_products_is_on_sale ON public.kinguin_products(is_on_sale) WHERE is_on_sale = true;
CREATE INDEX idx_bundle_items_bundle_id ON public.bundle_items(bundle_id);
CREATE INDEX idx_bundle_items_product_id ON public.bundle_items(kinguin_product_id);

-- Enable RLS
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_bundles (public read, admin write)
CREATE POLICY "Anyone can view active bundles"
ON public.product_bundles
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage bundles"
ON public.product_bundles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS policies for bundle_items (public read through bundle, admin write)
CREATE POLICY "Anyone can view bundle items"
ON public.bundle_items
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage bundle items"
ON public.bundle_items
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at on bundles
CREATE TRIGGER update_product_bundles_updated_at
BEFORE UPDATE ON public.product_bundles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
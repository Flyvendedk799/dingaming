-- Create shard_cases table for case definitions
CREATE TABLE public.shard_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  calculated_price integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create shard_case_items table for items in each case
CREATE TABLE public.shard_case_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.shard_cases(id) ON DELETE CASCADE,
  kinguin_product_id uuid NOT NULL REFERENCES public.kinguin_products(id) ON DELETE CASCADE,
  drop_percentage numeric NOT NULL CHECK (drop_percentage >= 0 AND drop_percentage <= 100),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create shard_case_openings table for recording user openings
CREATE TABLE public.shard_case_openings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  case_id uuid NOT NULL REFERENCES public.shard_cases(id) ON DELETE CASCADE,
  won_item_id uuid NOT NULL REFERENCES public.shard_case_items(id),
  shards_spent integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.shard_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shard_case_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shard_case_openings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shard_cases
CREATE POLICY "Anyone can view active cases"
ON public.shard_cases
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage cases"
ON public.shard_cases
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for shard_case_items
CREATE POLICY "Anyone can view case items"
ON public.shard_case_items
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.shard_cases 
  WHERE id = case_id AND is_active = true
));

CREATE POLICY "Admins can manage case items"
ON public.shard_case_items
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for shard_case_openings
CREATE POLICY "Users can view their own openings"
ON public.shard_case_openings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all openings"
ON public.shard_case_openings
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_shard_case_items_case_id ON public.shard_case_items(case_id);
CREATE INDEX idx_shard_case_openings_user_id ON public.shard_case_openings(user_id);
CREATE INDEX idx_shard_case_openings_case_id ON public.shard_case_openings(case_id);

-- Trigger to update updated_at on shard_cases
CREATE TRIGGER update_shard_cases_updated_at
BEFORE UPDATE ON public.shard_cases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
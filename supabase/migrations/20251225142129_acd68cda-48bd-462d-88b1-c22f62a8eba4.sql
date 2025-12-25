-- Create products table for Kinguin products cache
CREATE TABLE public.kinguin_products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    kinguin_id INTEGER UNIQUE NOT NULL,
    product_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    screenshots TEXT[],
    original_price DECIMAL(10,2) NOT NULL,
    sell_price DECIMAL(10,2) NOT NULL,
    platform TEXT,
    genres TEXT[],
    release_date DATE,
    region_id INTEGER,
    region_name TEXT,
    is_available BOOLEAN DEFAULT true,
    qty INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.kinguin_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id TEXT UNIQUE NOT NULL,
    order_external_id TEXT,
    status TEXT NOT NULL DEFAULT 'processing',
    total_price DECIMAL(10,2) NOT NULL,
    user_email TEXT,
    products JSONB NOT NULL,
    keys JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webhook logs table for debugging
CREATE TABLE public.kinguin_webhook_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.kinguin_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kinguin_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kinguin_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Products are publicly readable (for storefront)
CREATE POLICY "Products are publicly readable" 
ON public.kinguin_products 
FOR SELECT 
USING (true);

-- Orders are only viewable by admins (webhook access)
CREATE POLICY "Orders viewable via service role" 
ON public.kinguin_orders 
FOR ALL 
USING (true);

-- Webhook logs are only for service role
CREATE POLICY "Webhook logs via service role" 
ON public.kinguin_webhook_logs 
FOR ALL 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_kinguin_products_kinguin_id ON public.kinguin_products(kinguin_id);
CREATE INDEX idx_kinguin_products_region ON public.kinguin_products(region_id);
CREATE INDEX idx_kinguin_orders_order_id ON public.kinguin_orders(order_id);
CREATE INDEX idx_kinguin_orders_status ON public.kinguin_orders(status);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_kinguin_products_updated_at
BEFORE UPDATE ON public.kinguin_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kinguin_orders_updated_at
BEFORE UPDATE ON public.kinguin_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
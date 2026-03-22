
ALTER TABLE public.kinguin_orders ADD COLUMN user_id uuid;

-- RLS: allow authenticated users to SELECT their own orders
CREATE POLICY "Users can view their own orders"
ON public.kinguin_orders
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Keep existing ALL policy for service role, add admin view
CREATE POLICY "Admins can view all orders"
ON public.kinguin_orders
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

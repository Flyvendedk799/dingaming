-- Make the admin panel's controls actually work.
--
-- `store_settings` and `kinguin_products` were readable by everyone but had no
-- write policy at all, so an admin's UPDATE matched zero rows. PostgREST answers
-- 204 for an update that affects nothing, so the UI reported success while the
-- value never changed — the global margin, the EUR rate, and every
-- featured/on-sale toggle silently did nothing. That is why no product has ever
-- carried the is_on_sale flag and the Deals page renders empty.
--
-- The sync/checkout edge functions reach these tables with the service role,
-- which does not consult RLS, so they are unaffected by any of this.

-- Store settings: readable by the storefront (pricing), writable by admins.
CREATE POLICY "Admins can manage store settings"
ON public.store_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Catalogue: the sync owns the Kinguin-sourced columns, but an admin needs to
-- curate merchandising fields (featured, on sale, per-product margin).
CREATE POLICY "Admins can manage products"
ON public.kinguin_products
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins could already read `orders` but not the line items on them, so an
-- order detail view came back with no products.
CREATE POLICY "Admins can view all order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

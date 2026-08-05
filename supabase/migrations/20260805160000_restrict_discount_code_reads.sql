-- Stop handing out the promo codes.
--
-- "Anyone can view active discount codes" let any visitor list every active
-- code and its value, so codes meant for specific customers could just be
-- read off the API and used by anyone.
--
-- Nothing in the client reads this table: the checkout calls the
-- validate-discount edge function, which runs with the service role and is
-- unaffected by RLS. Admins keep full access through their existing policy.

DROP POLICY IF EXISTS "Anyone can view active discount codes" ON public.discount_codes;

CREATE POLICY "Admins can view discount codes"
ON public.discount_codes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

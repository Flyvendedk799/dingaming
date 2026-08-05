-- Remove the world-open policies on kinguin_orders / kinguin_webhook_logs.
--
-- Both were created as `FOR ALL USING (true)` and named "via service role",
-- but the service role bypasses RLS altogether — a policy is never needed for
-- it. What these actually did was grant every operation to every caller,
-- including anon. kinguin_orders holds customer emails and delivered game
-- keys, so any visitor could read them, and DELETE succeeded as well.
--
-- The narrow SELECT policies added in 20260322204923 (own orders for the
-- buyer, all orders for admins) already cover legitimate client access, and
-- the edge functions keep full access through the service role.

DROP POLICY IF EXISTS "Orders viewable via service role" ON public.kinguin_orders;
DROP POLICY IF EXISTS "Webhook logs via service role" ON public.kinguin_webhook_logs;

-- Admins manage orders from the admin panel; nobody else writes this table
-- from the client.
CREATE POLICY "Admins can manage kinguin orders"
ON public.kinguin_orders
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Webhook logs are diagnostics: readable by admins, written only by the
-- service role (which is not subject to these policies).
CREATE POLICY "Admins can view webhook logs"
ON public.kinguin_webhook_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

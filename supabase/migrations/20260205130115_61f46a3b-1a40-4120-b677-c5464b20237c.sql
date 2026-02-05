-- Allow admins to insert shard transactions (for manual grants)
CREATE POLICY "Admins can insert shard transactions"
ON public.shard_transactions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));
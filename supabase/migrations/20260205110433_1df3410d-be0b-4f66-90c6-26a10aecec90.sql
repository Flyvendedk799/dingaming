-- Drop the overly permissive policy and create proper ones
DROP POLICY IF EXISTS "Service role can manage sessions" ON public.game_sessions;

-- Game sessions should only be created/managed by edge functions (service role)
-- We don't need explicit policies for this as service role bypasses RLS
-- Users should not be able to INSERT, UPDATE, or DELETE their own game sessions

-- This is secure because:
-- 1. Users can only SELECT their own sessions (for history viewing)
-- 2. Admins can SELECT all sessions (for monitoring)
-- 3. Edge functions use service role which bypasses RLS entirely
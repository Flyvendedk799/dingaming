-- Create game_sessions table for storing game state
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL, -- 'mines', 'dice', etc.
  state JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX idx_game_sessions_user_active ON public.game_sessions(user_id, is_active);
CREATE INDEX idx_game_sessions_session_id ON public.game_sessions(session_id);

-- Enable RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own game sessions
CREATE POLICY "Users can view their own game sessions"
  ON public.game_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all sessions
CREATE POLICY "Admins can view all game sessions"
  ON public.game_sessions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can manage all (for edge functions)
CREATE POLICY "Service role can manage sessions"
  ON public.game_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add game-related transaction types to make it clearer
COMMENT ON TABLE public.game_sessions IS 'Stores active and completed game sessions for sweepstake games';

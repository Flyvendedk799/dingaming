-- =============================================
-- CUSTOMER CLUB LOYALTY SYSTEM DATABASE SCHEMA
-- =============================================

-- 1. Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function for role checking (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Create profiles table
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,
    avatar_url text,
    total_purchases numeric NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create shard_balances table
CREATE TABLE public.shard_balances (
    user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance integer NOT NULL DEFAULT 0,
    lifetime_earned integer NOT NULL DEFAULT 0,
    lifetime_spent integer NOT NULL DEFAULT 0,
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shard_balances ENABLE ROW LEVEL SECURITY;

-- 6. Create shard_transactions table
CREATE TABLE public.shard_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount integer NOT NULL,
    type text NOT NULL,
    description text NOT NULL,
    reference_id text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shard_transactions ENABLE ROW LEVEL SECURITY;

-- 7. Create daily_logins table
CREATE TABLE public.daily_logins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    login_date date NOT NULL,
    streak_count integer NOT NULL DEFAULT 1,
    shards_awarded integer NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, login_date)
);

ALTER TABLE public.daily_logins ENABLE ROW LEVEL SECURITY;

-- 8. Create reward_items table
CREATE TABLE public.reward_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text NOT NULL,
    type text NOT NULL DEFAULT 'voucher',
    shard_cost integer NOT NULL,
    value_dkk numeric,
    stock integer,
    image_url text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reward_items ENABLE ROW LEVEL SECURITY;

-- 9. Create user_rewards table
CREATE TABLE public.user_rewards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reward_id uuid NOT NULL REFERENCES public.reward_items(id) ON DELETE CASCADE,
    shards_spent integer NOT NULL,
    voucher_code text,
    status text NOT NULL DEFAULT 'active',
    used_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- 10. Create shard_earning_rules table
CREATE TABLE public.shard_earning_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type text NOT NULL UNIQUE,
    base_shards integer,
    percentage numeric,
    streak_multiplier numeric,
    max_shards integer,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shard_earning_rules ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- user_roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- shard_balances policies
CREATE POLICY "Users can view their own balance"
ON public.shard_balances FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all balances"
ON public.shard_balances FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- shard_transactions policies
CREATE POLICY "Users can view their own transactions"
ON public.shard_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
ON public.shard_transactions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- daily_logins policies
CREATE POLICY "Users can view their own logins"
ON public.daily_logins FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all logins"
ON public.daily_logins FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- reward_items policies (publicly readable)
CREATE POLICY "Anyone can view active rewards"
ON public.reward_items FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage rewards"
ON public.reward_items FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- user_rewards policies
CREATE POLICY "Users can view their own rewards"
ON public.user_rewards FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user rewards"
ON public.user_rewards FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- shard_earning_rules policies
CREATE POLICY "Anyone can view active rules"
ON public.shard_earning_rules FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage rules"
ON public.shard_earning_rules FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- TRIGGERS FOR AUTO-CREATION
-- =============================================

-- Function to create profile and shard balance on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  
  -- Create shard balance
  INSERT INTO public.shard_balances (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update shard balance when transaction is inserted
CREATE OR REPLACE FUNCTION public.handle_shard_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.shard_balances
  SET 
    balance = balance + NEW.amount,
    lifetime_earned = CASE WHEN NEW.amount > 0 THEN lifetime_earned + NEW.amount ELSE lifetime_earned END,
    lifetime_spent = CASE WHEN NEW.amount < 0 THEN lifetime_spent + ABS(NEW.amount) ELSE lifetime_spent END,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Trigger on shard_transactions
CREATE TRIGGER on_shard_transaction_insert
  AFTER INSERT ON public.shard_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_shard_transaction();

-- Updated_at triggers for tables that need them
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shard_balances_updated_at
  BEFORE UPDATE ON public.shard_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reward_items_updated_at
  BEFORE UPDATE ON public.reward_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shard_earning_rules_updated_at
  BEFORE UPDATE ON public.shard_earning_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SEED INITIAL DATA
-- =============================================

-- Insert default earning rules
INSERT INTO public.shard_earning_rules (action_type, base_shards, percentage, streak_multiplier, is_active) VALUES
('purchase', NULL, 1.0, NULL, true),
('daily_login', 50, NULL, 25, true),
('streak_bonus_7', 200, NULL, NULL, true);

-- Insert initial reward items (vouchers)
INSERT INTO public.reward_items (name, description, type, shard_cost, value_dkk, is_active) VALUES
('25 DKK Voucher', 'Get 25 DKK off your next purchase', 'voucher', 25000, 25, true),
('50 DKK Voucher', 'Get 50 DKK off your next purchase', 'voucher', 50000, 50, true),
('100 DKK Voucher', 'Get 100 DKK off your next purchase', 'voucher', 100000, 100, true),
('200 DKK Voucher', 'Get 200 DKK off your next purchase', 'voucher', 200000, 200, true);
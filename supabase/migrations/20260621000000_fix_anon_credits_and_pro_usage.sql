-- Fix 1: Add 'progress' to the tool constraint and support anon generations
ALTER TABLE public.generations
  DROP CONSTRAINT IF EXISTS generations_tool_check;

-- Make user_id nullable so anonymous generations can be stored
ALTER TABLE public.generations
  ALTER COLUMN user_id DROP NOT NULL;

-- Add anon_id column for anonymous user tracking
ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS anon_id text;

ALTER TABLE public.generations
  ADD CONSTRAINT generations_tool_check
  CHECK (tool IN ('lesson', 'worksheet', 'check', 'corrector', 'vocabulary', 'exam', 'progress'));

-- Ensure either user_id or anon_id is present
ALTER TABLE public.generations
  ADD CONSTRAINT generations_identity_check
  CHECK (user_id IS NOT NULL OR anon_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS generations_anon_id_idx ON public.generations(anon_id);

-- Fix 2: Anonymous credit system
CREATE TABLE IF NOT EXISTS public.anon_credits (
  anon_id text PRIMARY KEY,
  credits_remaining int NOT NULL DEFAULT 10,
  credits_reset_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- No RLS on anon_credits — accessed only via service role in RPC functions

CREATE OR REPLACE FUNCTION public.deduct_anon_credit(p_anon_id text)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance int;
BEGIN
  -- Upsert the row so first-time anon users are automatically initialized
  INSERT INTO public.anon_credits (anon_id, credits_remaining, credits_reset_at)
  VALUES (p_anon_id, 10, now())
  ON CONFLICT (anon_id) DO NOTHING;

  -- Reset monthly credits if 30+ days have passed
  UPDATE public.anon_credits
  SET credits_remaining = 10,
      credits_reset_at = now()
  WHERE anon_id = p_anon_id
    AND credits_reset_at < now() - INTERVAL '30 days';

  -- Deduct one credit; returns NULL if none remaining
  UPDATE public.anon_credits
  SET credits_remaining = credits_remaining - 1
  WHERE anon_id = p_anon_id
    AND credits_remaining > 0
  RETURNING credits_remaining INTO new_balance;

  RETURN new_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_anon_credit(p_anon_id text)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance int;
BEGIN
  UPDATE public.anon_credits
  SET credits_remaining = LEAST(credits_remaining + 1, 10)
  WHERE anon_id = p_anon_id
  RETURNING credits_remaining INTO new_balance;

  RETURN new_balance;
END;
$$;

-- Fix 3: Pro daily usage tracking
CREATE TABLE IF NOT EXISTS public.pro_usage (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  usage_count int NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, usage_date)
);

ALTER TABLE public.pro_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own pro usage"
  ON public.pro_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS pro_usage_user_date_idx ON public.pro_usage(user_id, usage_date);

-- Returns the new usage count, or NULL if the daily limit has been reached
CREATE OR REPLACE FUNCTION public.check_and_increment_pro_usage(
  p_user_id uuid,
  p_daily_limit int
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count int;
BEGIN
  -- Upsert today's row
  INSERT INTO public.pro_usage (user_id, usage_date, usage_count)
  VALUES (p_user_id, CURRENT_DATE, 0)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  -- Check limit before incrementing
  UPDATE public.pro_usage
  SET usage_count = usage_count + 1
  WHERE user_id = p_user_id
    AND usage_date = CURRENT_DATE
    AND usage_count < p_daily_limit
  RETURNING usage_count INTO new_count;

  -- new_count is NULL when limit was already reached
  RETURN new_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_pro_usage(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.pro_usage
  SET usage_count = GREATEST(usage_count - 1, 0)
  WHERE user_id = p_user_id
    AND usage_date = CURRENT_DATE;
END;
$$;

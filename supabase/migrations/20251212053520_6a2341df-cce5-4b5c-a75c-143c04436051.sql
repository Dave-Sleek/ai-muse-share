-- Add coin_reward column to achievements table
ALTER TABLE public.achievements ADD COLUMN coin_reward integer NOT NULL DEFAULT 10;

-- Update existing achievements with coin rewards
UPDATE public.achievements SET coin_reward = 
  CASE 
    WHEN requirement_value >= 100 THEN 50
    WHEN requirement_value >= 50 THEN 30
    WHEN requirement_value >= 10 THEN 20
    ELSE 10
  END;

-- Create daily_logins table for tracking login streaks and rewards
CREATE TABLE public.daily_logins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  login_date date NOT NULL DEFAULT CURRENT_DATE,
  coins_earned integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, login_date)
);

-- Enable RLS on daily_logins
ALTER TABLE public.daily_logins ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_logins
CREATE POLICY "Users can view their own logins"
ON public.daily_logins FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logins"
ON public.daily_logins FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add streak_coins_claimed column to track which streak milestones have been rewarded
ALTER TABLE public.user_streaks ADD COLUMN streak_coins_claimed integer[] NOT NULL DEFAULT '{}';

-- Function to claim daily login bonus
CREATE OR REPLACE FUNCTION public.claim_daily_login()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today date := CURRENT_DATE;
  v_consecutive_days integer;
  v_base_reward integer := 5;
  v_bonus integer := 0;
  v_total_reward integer;
  v_already_claimed boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if already claimed today
  SELECT EXISTS(
    SELECT 1 FROM public.daily_logins 
    WHERE user_id = v_user_id AND login_date = v_today
  ) INTO v_already_claimed;

  IF v_already_claimed THEN
    RETURN jsonb_build_object('success', false, 'message', 'Already claimed today', 'coins', 0);
  END IF;

  -- Calculate consecutive days
  SELECT COUNT(*) INTO v_consecutive_days
  FROM (
    SELECT login_date
    FROM public.daily_logins
    WHERE user_id = v_user_id
      AND login_date >= v_today - INTERVAL '6 days'
      AND login_date < v_today
    ORDER BY login_date DESC
  ) sub
  WHERE login_date = v_today - (row_number() OVER (ORDER BY login_date DESC))::integer;

  v_consecutive_days := v_consecutive_days + 1;

  -- Bonus for consecutive days (max 7 day streak = +10 bonus)
  v_bonus := LEAST(v_consecutive_days - 1, 6) * 2;
  v_total_reward := v_base_reward + v_bonus;

  -- Insert login record
  INSERT INTO public.daily_logins (user_id, login_date, coins_earned)
  VALUES (v_user_id, v_today, v_total_reward);

  -- Credit coins to user
  UPDATE public.profiles
  SET coin_balance = coin_balance + v_total_reward,
      total_earnings = total_earnings + v_total_reward
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true, 
    'coins', v_total_reward, 
    'consecutive_days', v_consecutive_days,
    'message', 'Daily bonus claimed!'
  );
END;
$$;

-- Function to credit achievement coins when unlocked
CREATE OR REPLACE FUNCTION public.credit_achievement_coins()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coin_reward integer;
BEGIN
  -- Get coin reward for this achievement
  SELECT coin_reward INTO v_coin_reward
  FROM public.achievements
  WHERE id = NEW.achievement_id;

  IF v_coin_reward > 0 THEN
    UPDATE public.profiles
    SET coin_balance = coin_balance + v_coin_reward,
        total_earnings = total_earnings + v_coin_reward
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to credit coins when achievement is unlocked
CREATE TRIGGER on_achievement_unlocked
AFTER INSERT ON public.user_achievements
FOR EACH ROW
EXECUTE FUNCTION public.credit_achievement_coins();

-- Function to claim streak milestone bonus
CREATE OR REPLACE FUNCTION public.claim_streak_milestone(p_milestone integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_current_streak integer;
  v_claimed_milestones integer[];
  v_reward integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate milestone
  IF p_milestone NOT IN (7, 30, 100) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid milestone');
  END IF;

  -- Get current streak info
  SELECT current_streak, streak_coins_claimed INTO v_current_streak, v_claimed_milestones
  FROM public.user_streaks
  WHERE user_id = v_user_id AND streak_type = 'posts';

  IF v_current_streak IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'No streak found');
  END IF;

  -- Check if milestone reached
  IF v_current_streak < p_milestone THEN
    RETURN jsonb_build_object('success', false, 'message', 'Milestone not reached yet');
  END IF;

  -- Check if already claimed
  IF p_milestone = ANY(v_claimed_milestones) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Already claimed this milestone');
  END IF;

  -- Determine reward
  v_reward := CASE p_milestone
    WHEN 7 THEN 25
    WHEN 30 THEN 100
    WHEN 100 THEN 500
  END;

  -- Update claimed milestones
  UPDATE public.user_streaks
  SET streak_coins_claimed = array_append(streak_coins_claimed, p_milestone)
  WHERE user_id = v_user_id AND streak_type = 'posts';

  -- Credit coins
  UPDATE public.profiles
  SET coin_balance = coin_balance + v_reward,
      total_earnings = total_earnings + v_reward
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true, 'coins', v_reward, 'milestone', p_milestone);
END;
$$;
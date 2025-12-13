-- Fix the claim_daily_login function - window functions not allowed in WHERE
CREATE OR REPLACE FUNCTION public.claim_daily_login()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_today date := CURRENT_DATE;
  v_consecutive_days integer := 0;
  v_base_reward integer := 5;
  v_bonus integer := 0;
  v_total_reward integer;
  v_already_claimed boolean;
  v_check_date date;
  v_found boolean;
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

  -- Calculate consecutive days by checking each previous day
  FOR i IN 1..6 LOOP
    v_check_date := v_today - i;
    SELECT EXISTS(
      SELECT 1 FROM public.daily_logins 
      WHERE user_id = v_user_id AND login_date = v_check_date
    ) INTO v_found;
    
    IF v_found THEN
      v_consecutive_days := v_consecutive_days + 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- Add 1 for today
  v_consecutive_days := v_consecutive_days + 1;

  -- Bonus for consecutive days (max 7 day streak = +12 bonus)
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
$function$;
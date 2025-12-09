-- Create user_streaks table to track consecutive activity days
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  streak_type TEXT NOT NULL DEFAULT 'posts',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, streak_type)
);

-- Enable Row Level Security
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own streaks"
ON public.user_streaks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own streaks"
ON public.user_streaks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
ON public.user_streaks
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_streaks_updated_at
BEFORE UPDATE ON public.user_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update streak when user creates a post
CREATE OR REPLACE FUNCTION public.update_post_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get existing streak info
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_date, v_current_streak, v_longest_streak
  FROM public.user_streaks
  WHERE user_id = NEW.user_id AND streak_type = 'posts';

  IF NOT FOUND THEN
    -- First time posting, create streak record
    INSERT INTO public.user_streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date)
    VALUES (NEW.user_id, 'posts', 1, 1, v_today);
  ELSIF v_last_date = v_today THEN
    -- Already posted today, do nothing
    NULL;
  ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
    -- Consecutive day, increment streak
    UPDATE public.user_streaks
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_activity_date = v_today
    WHERE user_id = NEW.user_id AND streak_type = 'posts';
  ELSE
    -- Streak broken, start new
    UPDATE public.user_streaks
    SET current_streak = 1,
        last_activity_date = v_today
    WHERE user_id = NEW.user_id AND streak_type = 'posts';
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to update streak on new post
CREATE TRIGGER on_post_created_update_streak
AFTER INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_post_streak();
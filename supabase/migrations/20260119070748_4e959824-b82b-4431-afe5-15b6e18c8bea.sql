-- Make post_id nullable in notifications table for follow notifications
ALTER TABLE public.notifications ALTER COLUMN post_id DROP NOT NULL;

-- Update the notify_on_follow function to not include post_id (it will be null for follows)
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create notification for the user being followed (without post_id)
  INSERT INTO public.notifications (user_id, actor_id, type, post_id)
  VALUES (
    NEW.following_id,
    NEW.follower_id,
    'follow',
    NULL
  );
  RETURN NEW;
END;
$$;
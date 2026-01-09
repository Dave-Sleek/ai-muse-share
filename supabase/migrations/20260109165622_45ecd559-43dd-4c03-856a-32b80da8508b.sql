-- Create trigger function for follow notifications
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create notification for the user being followed
  INSERT INTO public.notifications (user_id, actor_id, type)
  VALUES (
    NEW.following_id,
    NEW.follower_id,
    'follow'
  );
  RETURN NEW;
END;
$$;

-- Create trigger on follows table
CREATE TRIGGER on_follow_notify
AFTER INSERT ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_follow();
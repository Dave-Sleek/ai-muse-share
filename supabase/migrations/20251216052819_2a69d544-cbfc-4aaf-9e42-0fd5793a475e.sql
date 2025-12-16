-- Add gift_id column to notifications table
ALTER TABLE public.notifications 
ADD COLUMN gift_id uuid REFERENCES public.virtual_gifts(id);

-- Update the notify_on_gift function to include gift_id
CREATE OR REPLACE FUNCTION public.notify_on_gift()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create notification for recipient with gift details
  INSERT INTO public.notifications (user_id, post_id, actor_id, type, gift_id)
  VALUES (
    NEW.recipient_id,
    COALESCE(NEW.post_id, '00000000-0000-0000-0000-000000000000'::uuid),
    NEW.sender_id,
    'gift',
    NEW.gift_id
  );
  RETURN NEW;
END;
$function$;
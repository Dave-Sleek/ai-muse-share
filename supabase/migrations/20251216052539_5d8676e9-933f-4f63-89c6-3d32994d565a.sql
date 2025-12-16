-- Create trigger function to notify on gift received
CREATE OR REPLACE FUNCTION public.notify_on_gift()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create notification for recipient (sender is actor)
  INSERT INTO public.notifications (user_id, post_id, actor_id, type)
  VALUES (
    NEW.recipient_id,
    COALESCE(NEW.post_id, '00000000-0000-0000-0000-000000000000'::uuid),
    NEW.sender_id,
    'gift'
  );
  RETURN NEW;
END;
$function$;

-- Create trigger for gift transactions
DROP TRIGGER IF EXISTS on_gift_sent ON public.gift_transactions;
CREATE TRIGGER on_gift_sent
  AFTER INSERT ON public.gift_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_gift();
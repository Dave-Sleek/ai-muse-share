-- Drop the old constraint and add a new one that includes 'follow' and 'gift' types
ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY['like'::text, 'comment'::text, 'follow'::text, 'gift'::text]));
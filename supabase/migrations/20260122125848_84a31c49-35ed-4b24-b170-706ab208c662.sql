-- Create banned_users table to track banned/suspended users
CREATE TABLE public.banned_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    banned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT,
    banned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL means permanent ban
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view banned users
CREATE POLICY "Admins can view banned users"
ON public.banned_users
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can ban users
CREATE POLICY "Admins can ban users"
ON public.banned_users
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update bans
CREATE POLICY "Admins can update bans"
ON public.banned_users
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can remove bans
CREATE POLICY "Admins can delete bans"
ON public.banned_users
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to check if user is banned
CREATE OR REPLACE FUNCTION public.is_user_banned(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.banned_users
    WHERE user_id = _user_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;
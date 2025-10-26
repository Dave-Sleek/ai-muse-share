-- Add new columns to profiles table for enhanced user information
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

-- Add a comment to describe the social_links structure
COMMENT ON COLUMN public.profiles.social_links IS 'JSON object containing social media links, e.g. {"twitter": "url", "instagram": "url", "linkedin": "url", "website": "url"}';
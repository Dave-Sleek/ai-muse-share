-- Create post_views table to track post views
CREATE TABLE public.post_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS on post_views
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- Post views are viewable by everyone
CREATE POLICY "Post views are viewable by everyone"
ON public.post_views
FOR SELECT
USING (true);

-- Anyone can insert post views (including anonymous users)
CREATE POLICY "Anyone can insert post views"
ON public.post_views
FOR INSERT
WITH CHECK (true);

-- Create follows table for user following
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS on follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Follows are viewable by everyone
CREATE POLICY "Follows are viewable by everyone"
ON public.follows
FOR SELECT
USING (true);

-- Users can follow others
CREATE POLICY "Users can create follows"
ON public.follows
FOR INSERT
WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can delete their follows"
ON public.follows
FOR DELETE
USING (auth.uid() = follower_id);
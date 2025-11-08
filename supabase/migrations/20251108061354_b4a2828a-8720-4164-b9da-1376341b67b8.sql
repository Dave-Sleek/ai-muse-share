-- Add tags column to posts table
ALTER TABLE public.posts 
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create an index for better search performance on tags
CREATE INDEX idx_posts_tags ON public.posts USING GIN(tags);

-- Create an index for sorting by creation date
CREATE INDEX idx_posts_created_at ON public.posts (created_at DESC);
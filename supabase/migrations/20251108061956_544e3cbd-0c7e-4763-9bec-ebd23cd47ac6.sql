-- Add ai_model column to posts table
ALTER TABLE public.posts 
ADD COLUMN ai_model TEXT;

-- Create an index for filtering by AI model
CREATE INDEX idx_posts_ai_model ON public.posts (ai_model);
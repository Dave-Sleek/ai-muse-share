-- Fix the post_views policy to be more restrictive
-- Instead of allowing anyone to insert any post_id, validate that the post exists
DROP POLICY IF EXISTS "Anyone can insert post views" ON post_views;

-- Create a new policy that validates the post exists
CREATE POLICY "Users can record views on existing posts" 
ON post_views 
FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM posts WHERE id = post_id)
);
-- Fix 1: Add file size and MIME type restrictions to post-images bucket
UPDATE storage.buckets
SET 
  file_size_limit = 10485760,  -- 10MB (matches client validation)
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
WHERE name = 'post-images';

-- Fix 2: Remove overly permissive policies on view_earnings table
-- These operations should only happen via the credit_view_earnings trigger with SECURITY DEFINER
DROP POLICY IF EXISTS "System can insert view earnings" ON view_earnings;
DROP POLICY IF EXISTS "System can update view earnings" ON view_earnings;
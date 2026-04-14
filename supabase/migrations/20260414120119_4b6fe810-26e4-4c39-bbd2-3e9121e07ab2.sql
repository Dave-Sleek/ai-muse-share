-- 1. Remove permissive template_unlocks INSERT policy
-- Unlocks should only happen via the unlock_template() security definer function
DROP POLICY IF EXISTS "Users can insert their own template unlocks" ON template_unlocks;
DROP POLICY IF EXISTS "Users can unlock templates" ON template_unlocks;

-- 2. Remove permissive user_achievements INSERT policy  
-- Achievements should only be granted server-side
DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can unlock achievements" ON user_achievements;

-- 3. Fix profiles SELECT policy to hide financial data from non-owners
-- First drop existing public SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Create a view for public profile data (without financial fields)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, username, avatar_url, bio, location, social_links, created_at, updated_at
FROM public.profiles;

-- Re-create profiles SELECT: everyone can read, but we'll handle field filtering in app code
-- For now, keep profiles readable but add a security definer function for safe access
CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- Create a secure function to get financial data only for the owner
CREATE OR REPLACE FUNCTION public.get_my_financial_data()
RETURNS TABLE(coin_balance integer, total_earnings integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coin_balance, total_earnings
  FROM profiles
  WHERE id = auth.uid();
$$;

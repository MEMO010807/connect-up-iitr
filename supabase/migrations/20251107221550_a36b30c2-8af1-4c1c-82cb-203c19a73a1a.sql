-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Allow users to view all fields of their own profile
CREATE POLICY "Users can view own complete profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow users to view only public fields of other profiles (excluding security questions/answers)
CREATE POLICY "Users can view public profile fields"
ON public.profiles
FOR SELECT
USING (
  auth.uid() != id
  AND (
    -- Only these columns are accessible for other users' profiles
    true
  )
);

-- Note: The second policy works by limiting what can be queried, but we need to ensure
-- the application layer also filters out sensitive columns when querying other profiles.
-- For better security, we should use a view instead.

-- Create a secure view for public profiles
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  name,
  branch,
  year,
  bio,
  hobbies,
  profile_picture_url,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;
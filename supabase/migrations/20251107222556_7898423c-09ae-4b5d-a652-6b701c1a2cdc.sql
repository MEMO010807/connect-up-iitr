-- Fix matches table: Add INSERT policy to allow the system to create matches
-- This fixes the broken match creation functionality
CREATE POLICY "System can create matches via trigger"
ON matches FOR INSERT
WITH CHECK (true);

-- Tighten profiles RLS policies: Change SELECT policies from 'public' to 'authenticated'
-- This ensures only logged-in users can view profiles
DROP POLICY IF EXISTS "Users can view own complete profile" ON profiles;
DROP POLICY IF EXISTS "Users can view public profile fields" ON profiles;

CREATE POLICY "Authenticated users can view own complete profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view public profile fields"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() <> id);
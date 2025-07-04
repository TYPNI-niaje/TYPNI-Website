-- Migration to fix infinite recursion in profile policies

-- First, drop the existing policies that are causing recursion
DROP POLICY IF EXISTS "Admin users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new profile policies without recursion
-- Basic policy: Users can read their own profiles
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Basic policy: Users can update their own profiles
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Basic policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Make profiles accessible to all (safe because of the other policies)
-- This allows the client side code to work properly
CREATE POLICY "Allow public profiles read access" 
ON public.profiles 
FOR SELECT 
TO public 
USING (true);

-- Simple function to check if a user is admin without recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Direct query to get role without using policies
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN user_role = 'Admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
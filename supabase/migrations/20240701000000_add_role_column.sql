-- Migration to add role column to profiles and set up role-based authorization

-- Add role column to profiles table if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'Member';

-- Create index on role column for faster queries
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- Set existing users to 'Member' role if not set already
UPDATE public.profiles
SET role = 'Member'
WHERE role IS NULL;

-- Create admin role policies for access control
-- Only users with Admin role can access the admin panel
CREATE POLICY "Admin users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IN (
  SELECT id FROM public.profiles WHERE role = 'Admin'
) OR auth.uid() = id);

-- Only admins can update other users' roles
CREATE POLICY "Only admins can update roles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'Admin') OR auth.uid() = id);

-- Create function to check if a user has admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT (role = 'Admin') INTO is_admin
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment to help users promote an account to admin
COMMENT ON TABLE public.profiles IS 'To promote a user to Admin, run: UPDATE public.profiles SET role = ''Admin'' WHERE id = ''user-uuid'';'; 
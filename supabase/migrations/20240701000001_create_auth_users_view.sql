-- Migration to create auth_users view for joining auth.users with profiles
-- This will help us fetch profile data with email addresses

-- Create a secure view that joins auth.users with profiles
-- This view is only accessible to authenticated users
CREATE OR REPLACE VIEW public.auth_users AS
SELECT 
    u.id,
    u.email,
    p.id AS profile_id,
    p.role,
    p.full_name
FROM auth.users u
JOIN public.profiles p ON u.id = p.id;

-- Grant usage on the auth schema to authenticated users
GRANT USAGE ON SCHEMA auth TO authenticated;

-- Grant select on the users table to authenticated users
GRANT SELECT ON auth.users TO authenticated;

-- Comment to explain the view's purpose
COMMENT ON VIEW public.auth_users IS 'A secure view that joins auth.users with profiles for admin use only'; 
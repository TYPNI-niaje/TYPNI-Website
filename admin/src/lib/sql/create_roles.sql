-- Add role column to profiles table if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'Member';

-- Create index on role column for faster queries
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);

-- Set existing users to 'Member' role if not set already
UPDATE profiles
SET role = 'Member'
WHERE role IS NULL;

-- Create admin role policy
CREATE POLICY admin_policy ON profiles
FOR SELECT
USING (role = 'Admin');

-- To promote a user to Admin role, run:
-- UPDATE profiles
-- SET role = 'Admin'
-- WHERE email = 'admin@example.com';

-- To view all users and their roles:
-- SELECT id, email, role FROM auth.users JOIN profiles ON auth.users.id = profiles.id; 
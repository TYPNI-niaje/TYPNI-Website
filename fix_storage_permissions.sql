-- Migration for storage permissions fix

-- First drop all existing policies for the avatars bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_uploads" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_reads" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_updates" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_deletes" ON storage.objects;

-- Create simple and permissive policies that will work
-- Allow any authenticated user to upload to the avatars bucket with no additional checks
CREATE POLICY "allow_authenticated_uploads_simple"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow public read access to all files in avatars bucket
CREATE POLICY "allow_public_reads_simple"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow authenticated users to update any avatar
CREATE POLICY "allow_authenticated_updates_simple"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Allow authenticated users to delete any avatar
CREATE POLICY "allow_authenticated_deletes_simple"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars'); 
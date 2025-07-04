-- Clean up existing policies and bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_policy" ON storage.objects;

-- Delete existing bucket
DELETE FROM storage.buckets WHERE id = 'avatars';

-- Create fresh bucket with public access
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Create simple policies for the bucket
-- Allow all operations for authenticated users with minimal restrictions
-- Allow any authenticated user to upload to the avatars bucket
CREATE POLICY "allow_authenticated_uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow public read access to all files in avatars bucket
CREATE POLICY "allow_public_reads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow authenticated users to update any avatar
CREATE POLICY "allow_authenticated_updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Allow authenticated users to delete any avatar
CREATE POLICY "allow_authenticated_deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars'); 
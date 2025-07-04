-- Migration to create notification tracking capabilities
-- Version: 20240810000000

BEGIN;

-- Create table to track which notifications have been read (if not exists)
CREATE TABLE IF NOT EXISTS public.admin_notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  source_id TEXT NOT NULL,  -- ID of the referenced item (profile ID, action ID, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Drop existing indexes to avoid conflicts
DROP INDEX IF EXISTS admin_notification_reads_unique_idx;
DROP INDEX IF EXISTS admin_notification_reads_admin_idx;
DROP INDEX IF EXISTS admin_notification_reads_source_idx;

-- Create unique constraint to prevent duplicate reads
CREATE UNIQUE INDEX admin_notification_reads_unique_idx 
ON public.admin_notification_reads(admin_id, notification_type, source_id);

-- Create index for faster lookup
CREATE INDEX admin_notification_reads_admin_idx 
ON public.admin_notification_reads(admin_id);

-- Create index for source_id lookups
CREATE INDEX admin_notification_reads_source_idx
ON public.admin_notification_reads(source_id);

-- Enable row level security
ALTER TABLE public.admin_notification_reads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow admins to insert notification reads" ON public.admin_notification_reads;
DROP POLICY IF EXISTS "Allow admins to view their own notification reads" ON public.admin_notification_reads;

-- Create policy to allow authenticated admin users to insert read records
CREATE POLICY "Allow admins to insert notification reads"
ON public.admin_notification_reads
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = admin_id
);

-- Create policy to allow admins to view their own notification read records
CREATE POLICY "Allow admins to view their own notification reads"
ON public.admin_notification_reads
FOR SELECT
TO authenticated
USING (
  auth.uid() = admin_id
);

-- Drop existing function to avoid conflicts
DROP FUNCTION IF EXISTS public.mark_notification_read(UUID, VARCHAR, TEXT);

-- Function to mark notification as read
CREATE FUNCTION public.mark_notification_read(
  p_admin_id UUID,
  p_notification_type VARCHAR,
  p_source_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN;
BEGIN
  INSERT INTO public.admin_notification_reads (admin_id, notification_type, source_id)
  VALUES (p_admin_id, p_notification_type, p_source_id)
  ON CONFLICT (admin_id, notification_type, source_id) DO NOTHING;
  
  -- Return true if a row was affected, false otherwise
  success := FOUND;
  RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT; 
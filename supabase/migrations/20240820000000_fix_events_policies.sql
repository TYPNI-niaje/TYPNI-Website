-- Fix events table policies to properly check admin role from profiles table

-- First, drop existing policies
DROP POLICY IF EXISTS "Admin users can manage events" ON public.events;
DROP POLICY IF EXISTS "Admin users can create events" ON public.events;
DROP POLICY IF EXISTS "Admin users can update events" ON public.events;
DROP POLICY IF EXISTS "Admin users can delete events" ON public.events;

-- Create separate policies for each operation with proper role check
CREATE POLICY "Admin users can create events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'Admin'
  )
);

CREATE POLICY "Admin users can update events"
ON public.events
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'Admin'
  )
);

CREATE POLICY "Admin users can delete events"
ON public.events
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'Admin'
  )
);

-- Keep the existing select policy that allows everyone to view events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'events' 
    AND policyname = 'Events are viewable by everyone'
  ) THEN
    CREATE POLICY "Events are viewable by everyone"
    ON public.events
    FOR SELECT
    USING (true);
  END IF;
END
$$;

-- Ensure RLS is enabled
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY; 
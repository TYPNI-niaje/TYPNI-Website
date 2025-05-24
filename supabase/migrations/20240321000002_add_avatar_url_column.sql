-- Migration to add avatar_url column to profiles table

-- Add avatar_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN avatar_url text;
    END IF;
END $$; 
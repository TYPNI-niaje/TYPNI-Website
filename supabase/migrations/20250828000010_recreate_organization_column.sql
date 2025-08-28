-- Drop and recreate organization column to fix data corruption

-- Drop the existing organization column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS organization;

-- Recreate the organization column
ALTER TABLE public.profiles ADD COLUMN organization TEXT;

-- Update the handle_new_user function to properly handle the recreated organization column
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  interest_id UUID;
BEGIN
  -- Insert into profiles table with proper error handling
  BEGIN    
    INSERT INTO public.profiles (
      id,
      full_name,
      phone_number,
      id_number,
      date_of_birth,
      gender,
      country,
      is_employed,
      education_level,
      role,
      organization,
      partnership_type,
      pwd_status
    )
    VALUES (
      new.id,
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'phone_number',
      new.raw_user_meta_data->>'id_number',
      (CASE 
        WHEN new.raw_user_meta_data->>'date_of_birth' = '' THEN NULL 
        WHEN new.raw_user_meta_data->>'date_of_birth' IS NULL THEN NULL
        ELSE (new.raw_user_meta_data->>'date_of_birth')::DATE 
      END),
      (CASE
        WHEN new.raw_user_meta_data->>'gender' = '' THEN NULL
        WHEN new.raw_user_meta_data->>'gender' IS NULL THEN NULL 
        ELSE new.raw_user_meta_data->>'gender'
      END),
      (CASE
        WHEN new.raw_user_meta_data->>'country' = '' THEN NULL
        WHEN new.raw_user_meta_data->>'country' IS NULL THEN NULL
        ELSE INITCAP(new.raw_user_meta_data->>'country')
      END),
      (CASE
        WHEN new.raw_user_meta_data->>'is_employed' = 'true' THEN TRUE
        WHEN new.raw_user_meta_data->>'is_employed' = 'false' THEN FALSE
        ELSE NULL
      END),
      (CASE
        WHEN new.raw_user_meta_data->>'education_level' = '' THEN NULL
        WHEN new.raw_user_meta_data->>'education_level' IS NULL THEN NULL
        ELSE new.raw_user_meta_data->>'education_level'
      END),
      (CASE
        WHEN new.raw_user_meta_data->>'role' IS NULL THEN 'Member'
        ELSE new.raw_user_meta_data->>'role'
      END),
      -- Clean organization field mapping
      (CASE
        WHEN new.raw_user_meta_data->>'organization' = '' THEN NULL
        WHEN new.raw_user_meta_data->>'organization' IS NULL THEN NULL
        WHEN new.raw_user_meta_data->>'organization' = 'null' THEN NULL
        ELSE new.raw_user_meta_data->>'organization'
      END),
      (CASE
        WHEN new.raw_user_meta_data->>'partnership_type' = '' THEN NULL
        WHEN new.raw_user_meta_data->>'partnership_type' IS NULL THEN NULL
        ELSE new.raw_user_meta_data->>'partnership_type'
      END),
      (CASE
        WHEN new.raw_user_meta_data->>'pwd_status' = '' THEN NULL
        WHEN new.raw_user_meta_data->>'pwd_status' IS NULL THEN NULL
        ELSE new.raw_user_meta_data->>'pwd_status'
      END)
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error creating profile: %', SQLERRM;
      -- Continue anyway to try to process interests
  END;
  
  -- Process user interests - prioritize interest_ids if available
  IF new.raw_user_meta_data ? 'interest_ids' AND jsonb_array_length(new.raw_user_meta_data->'interest_ids') > 0 THEN
    -- Use the pre-collected interest IDs directly
    FOR interest_id IN 
      SELECT value::uuid FROM jsonb_array_elements_text(new.raw_user_meta_data->'interest_ids')
    LOOP
      BEGIN
        INSERT INTO public.user_interests (user_id, interest_id)
        VALUES (new.id, interest_id);
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Error inserting interest %: %', interest_id, SQLERRM;
          -- Continue with the next interest
      END;
    END LOOP;
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
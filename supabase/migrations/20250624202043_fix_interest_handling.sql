-- Drop the duplicate trigger first
DROP TRIGGER IF EXISTS on_auth_user_interests ON auth.users;

-- Update the handle_new_user function to properly handle interests
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  interest_id UUID;
  interest_value TEXT;
  interest_name TEXT;
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (
    id,
    full_name,
    phone_number,
    id_number,
    date_of_birth,
    gender,
    country,
    is_employed,
    education_level
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
    END)
  );

  -- Process user interests
  IF new.raw_user_meta_data ? 'interests' THEN
    FOR interest_value IN SELECT jsonb_array_elements_text(new.raw_user_meta_data->'interests')
    LOOP
      -- Map the form values to interest names in the database
      interest_name := CASE
        WHEN interest_value = 'youth-empowerment' THEN 'Youth Empowerment'
        WHEN interest_value = 'youth-mentorship' THEN 'Youth Mentorship'
        WHEN interest_value = 'youth-employment' THEN 'Youth Employment'
        WHEN interest_value = 'entrepreneurship' THEN 'Entrepreneurship'
        WHEN interest_value = 'financial-literacy' THEN 'Financial Literacy'
        WHEN interest_value = 'youth-representation' THEN 'Youth Representation'
        WHEN interest_value = 'education' THEN 'Education'
        WHEN interest_value = 'sports-arts-talent' THEN 'Sports, Arts & Talent'
        WHEN interest_value = 'pan-africanism' THEN 'Pan Africanism'
        WHEN interest_value = 'technology-digital-literacy' THEN 'Technology & Digital Literacy'
        WHEN interest_value = 'menstrual-health' THEN 'Menstrual Health'
        WHEN interest_value = 'sexual-education' THEN 'Sexual Education'
        WHEN interest_value = 'female-genital-mutilation' THEN 'Female Genital Mutilation'
        WHEN interest_value = 'childhood-marriages' THEN 'Childhood Marriages'
        WHEN interest_value = 'childhood-pregnancies' THEN 'Childhood Pregnancies'
        WHEN interest_value = 'alcohol-drugs-substance-abuse' THEN 'Alcohol, Drugs & Substance Abuse'
        WHEN interest_value = 'mental-health-action' THEN 'Mental Health Action'
        WHEN interest_value = 'inclusivity-young-pwds' THEN 'Inclusivity of Young PWDs'
        WHEN interest_value = 'cyberbullying' THEN 'Cyberbullying'
        WHEN interest_value = 'blood-donation' THEN 'Blood Donation'
        WHEN interest_value = 'climate-change-mitigation' THEN 'Climate Change Mitigation'
        WHEN interest_value = 'climate-change-adaptation-resilience' THEN 'Climate Change Adaptation & Resilience'
        WHEN interest_value = 'nature-based-solutions' THEN 'Nature-Based Solutions'
        WHEN interest_value = 'water-solutions-management' THEN 'Water Solutions & Management'
        WHEN interest_value = 'smart-agriculture' THEN 'Smart Agriculture'
        ELSE NULL
      END;
      
      -- Skip if mapping failed
      IF interest_name IS NOT NULL THEN
        -- Find the ID for the interest name
        SELECT id INTO interest_id
        FROM public.interests
        WHERE name = interest_name;
        
        IF interest_id IS NOT NULL THEN
          -- Insert into user_interests
          INSERT INTO public.user_interests (user_id, interest_id)
          VALUES (new.id, interest_id);
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix for event upload error
-- The issue is with the reserved word 'current_time' which returns a TIME type
-- but we need a TIMESTAMP WITH TIME ZONE for proper comparison

-- Drop and recreate the function with a different variable name to avoid conflict with reserved word
CREATE OR REPLACE FUNCTION public.update_event_status()
RETURNS TRIGGER AS $$
DECLARE
  current_timestamp_utc TIMESTAMP WITH TIME ZONE := timezone('utc'::text, now());
BEGIN
  -- Skip if status is canceled
  IF NEW.status = 'canceled' THEN
    RETURN NEW;
  END IF;
  
  -- Update status based on date
  IF NEW.end_date < current_timestamp_utc THEN
    NEW.status := 'past';
  ELSIF NEW.start_date <= current_timestamp_utc AND NEW.end_date >= current_timestamp_utc THEN
    NEW.status := 'ongoing';
  ELSE
    NEW.status := 'upcoming';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 
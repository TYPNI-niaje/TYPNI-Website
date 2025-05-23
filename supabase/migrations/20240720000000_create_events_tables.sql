-- Migration to create events and event registration tables

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  capacity INTEGER,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('in-person', 'online', 'hybrid')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('upcoming', 'ongoing', 'past', 'canceled')),
  banner_url TEXT,
  organizer_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create event registrations table
CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'canceled', 'no-show')),
  notes TEXT,
  UNIQUE (event_id, user_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_start_date ON public.events(start_date);
CREATE INDEX idx_events_type ON public.events(type);
CREATE INDEX idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX idx_event_registrations_status ON public.event_registrations(status);

-- Enable row level security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies for events table
CREATE POLICY "Events are viewable by everyone" 
  ON public.events FOR SELECT 
  USING (true);

CREATE POLICY "Admin users can manage events" 
  ON public.events 
  USING (
    -- Check if user is admin
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Create policies for event_registrations table
CREATE POLICY "Users can view their own registrations" 
  ON public.event_registrations FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can register for events" 
  ON public.event_registrations FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can cancel their own registrations" 
  ON public.event_registrations FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Admin users can view all registrations" 
  ON public.event_registrations FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Admin users can manage all registrations" 
  ON public.event_registrations FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Create function to automatically update the status of events based on date
CREATE OR REPLACE FUNCTION public.update_event_status()
RETURNS TRIGGER AS $$
DECLARE
  current_time TIMESTAMP WITH TIME ZONE := timezone('utc'::text, now());
BEGIN
  -- Skip if status is canceled
  IF NEW.status = 'canceled' THEN
    RETURN NEW;
  END IF;
  
  -- Update status based on date
  IF NEW.end_date < current_time THEN
    NEW.status := 'past';
  ELSIF NEW.start_date <= current_time AND NEW.end_date >= current_time THEN
    NEW.status := 'ongoing';
  ELSE
    NEW.status := 'upcoming';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update event status on insert or update
CREATE TRIGGER trigger_update_event_status
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_status();

-- Create function to update updated_at timestamp for events
CREATE OR REPLACE FUNCTION public.handle_event_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating event updated_at
CREATE TRIGGER handle_event_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_event_updated_at();

-- Create storage bucket for event banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('events', 'events', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow admin users to upload event banners
CREATE POLICY "Allow admins to upload event banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'events' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'Admin'
  )
);

-- Create policy to allow admin users to update event banners
CREATE POLICY "Allow admins to update event banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'events' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'Admin'
  )
);

-- Create policy to allow admin users to delete event banners
CREATE POLICY "Allow admins to delete event banners"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'events' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'Admin'
  )
);

-- Create policy to allow public access to event banners
CREATE POLICY "Allow public access to event banners"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'events');

-- Add comment to explain purpose
COMMENT ON TABLE public.events IS 'Stores event information';
COMMENT ON TABLE public.event_registrations IS 'Tracks user registrations for events'; 
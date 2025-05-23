-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Create policy to allow authenticated users to upload avatars
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT TO authenticated
USING (bucket_id = 'avatars');

-- Create policy to allow authenticated users to update their avatars
CREATE POLICY "Allow authenticated users to update avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars');

-- Create policy to allow authenticated users to delete their avatars
CREATE POLICY "Allow authenticated users to delete avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars');

-- Create policy to allow public access to avatars
CREATE POLICY "Allow public access to avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

-- Create a table for user profiles that extends the auth.users table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  phone_number text,
  id_number text unique,
  date_of_birth date,
  gender text check (gender in ('male', 'female', 'not Say')),
  country text,
  is_employed boolean default false,
  education_level text check (education_level in ('highschool', 'tvet', 'college', 'university')),
  avatar_url text, -- profile photo URL
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for user interests
create table public.interests (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a junction table for user interests
create table public.user_interests (
  user_id uuid references public.profiles on delete cascade not null,
  interest_id uuid references public.interests on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, interest_id)
);

-- Insert default interests
insert into public.interests (name) values
  ('Youth Empowerment'),
  ('Youth Mentorship'),
  ('Youth Employment'),
  ('Entrepreneurship'),
  ('Financial Literacy'),
  ('Youth Representation'),
  ('Education'),
  ('Sports, Arts & Talent'),
  ('Pan Africanism'),
  ('Technology & Digital Literacy'),
  ('Menstrual Health'),
  ('Sexual Education'),
  ('Female Genital Mutilation'),
  ('Childhood Marriages'),
  ('Childhood Pregnancies'),
  ('Alcohol, Drugs & Substance Abuse'),
  ('Mental Health Action'),
  ('Inclusivity of Young PWDs'),
  ('Cyberbullying'),
  ('Blood Donation'),
  ('Climate Change Mitigation'),
  ('Climate Change Adaptation & Resilience'),
  ('Nature-Based Solutions'),
  ('Water Solutions & Management'),
  ('Smart Agriculture');

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.interests enable row level security;
alter table public.user_interests enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile"
  on public.profiles for update
  using ( auth.uid() = id );

create policy "Interests are viewable by everyone"
  on public.interests for select
  using ( true );

create policy "Users can view their own interests"
  on public.user_interests for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own interests"
  on public.user_interests for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own interests"
  on public.user_interests for delete
  using ( auth.uid() = user_id );

-- Create function to handle user interests
create or replace function public.handle_user_interests()
returns trigger as $$
declare
  interest_values text[];
  interest_ids uuid[];
  interest_value text;
  interest_name text;
  i integer := 1;
begin
  -- Check if interests exist in metadata
  if new.raw_user_meta_data ? 'interests' then
    -- Extract interests array from metadata
    interest_values := array(select jsonb_array_elements_text(new.raw_user_meta_data->'interests'));
    
    interest_ids := array[]::uuid[];
    
    -- Get interest ids based on values
    for i in 1..array_length(interest_values, 1) loop
      interest_value := interest_values[i];
      
      -- Map the form values to interest names in the database
      -- Handle all the possible interest values
      interest_name := case
        when interest_value = 'youth-empowerment' then 'Youth Empowerment'
        when interest_value = 'youth-mentorship' then 'Youth Mentorship'
        when interest_value = 'youth-employment' then 'Youth Employment'
        when interest_value = 'entrepreneurship' then 'Entrepreneurship'
        when interest_value = 'financial-literacy' then 'Financial Literacy'
        when interest_value = 'youth-representation' then 'Youth Representation'
        when interest_value = 'education' then 'Education'
        when interest_value = 'sports-arts-talent' then 'Sports, Arts & Talent'
        when interest_value = 'pan-africanism' then 'Pan Africanism'
        when interest_value = 'technology-digital-literacy' then 'Technology & Digital Literacy'
        when interest_value = 'menstrual-health' then 'Menstrual Health'
        when interest_value = 'sexual-education' then 'Sexual Education'
        when interest_value = 'female-genital-mutilation' then 'Female Genital Mutilation'
        when interest_value = 'childhood-marriages' then 'Childhood Marriages'
        when interest_value = 'childhood-pregnancies' then 'Childhood Pregnancies'
        when interest_value = 'alcohol-drugs-substance-abuse' then 'Alcohol, Drugs & Substance Abuse'
        when interest_value = 'mental-health-action' then 'Mental Health Action'
        when interest_value = 'inclusivity-young-pwds' then 'Inclusivity of Young PWDs'
        when interest_value = 'cyberbullying' then 'Cyberbullying'
        when interest_value = 'blood-donation' then 'Blood Donation'
        when interest_value = 'climate-change-mitigation' then 'Climate Change Mitigation'
        when interest_value = 'climate-change-adaptation-resilience' then 'Climate Change Adaptation & Resilience'
        when interest_value = 'nature-based-solutions' then 'Nature-Based Solutions'
        when interest_value = 'water-solutions-management' then 'Water Solutions & Management'
        when interest_value = 'smart-agriculture' then 'Smart Agriculture'
        else null
      end;
      
      -- Skip if mapping failed
      if interest_name is not null then
        -- Find the ID for the interest name
        select id into strict interest_ids[i] 
        from public.interests 
        where name = interest_name;
        
        -- Insert into user_interests
        insert into public.user_interests (user_id, interest_id)
        values (new.id, interest_ids[i]);
      end if;
    end loop;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
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
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'id_number',
    (case 
      when new.raw_user_meta_data->>'date_of_birth' = '' then null 
      when new.raw_user_meta_data->>'date_of_birth' is null then null
      else (new.raw_user_meta_data->>'date_of_birth')::date 
    end),
    (case
      when new.raw_user_meta_data->>'gender' = '' then null
      when new.raw_user_meta_data->>'gender' is null then null 
      else new.raw_user_meta_data->>'gender'
    end),
    (case
      when new.raw_user_meta_data->>'country' = '' then null
      when new.raw_user_meta_data->>'country' is null then null
      else initcap(new.raw_user_meta_data->>'country')
    end),
    (case
      when new.raw_user_meta_data->>'is_employed' = 'true' then true
      when new.raw_user_meta_data->>'is_employed' = 'false' then false
      else null
    end),
    (case
      when new.raw_user_meta_data->>'education_level' = '' then null
      when new.raw_user_meta_data->>'education_level' is null then null
      else new.raw_user_meta_data->>'education_level'
    end)
  );
  
  -- After profile is created, process interests
  perform public.handle_user_interests();
  
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create trigger for handling user interests
create trigger on_auth_user_interests
  after insert on auth.users
  for each row execute procedure public.handle_user_interests();

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for updating updated_at
create trigger handle_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at(); 
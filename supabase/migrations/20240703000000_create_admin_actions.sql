-- Create admin_actions table for tracking admin activity
create table if not exists admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references profiles(id) on delete set null,
  action text not null,
  details jsonb,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Index for faster queries by admin and time
create index if not exists idx_admin_actions_admin_id on admin_actions(admin_id);
create index if not exists idx_admin_actions_created_at on admin_actions(created_at); 
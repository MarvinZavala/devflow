-- Create focus_sessions table for analytics
create table public.focus_sessions (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) not null,
  task_id uuid references public.tasks(id) on delete set null,
  started_at timestamp with time zone not null,
  ended_at timestamp with time zone not null,
  duration_seconds integer not null,
  status text check (status in ('completed', 'abandoned')) default 'completed'
);

-- Enable RLS
alter table public.focus_sessions enable row level security;

-- Policies
create policy "Users can view their own focus sessions" on public.focus_sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own focus sessions" on public.focus_sessions
  for insert with check (auth.uid() = user_id);

-- Create tables for DevFlow

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Workspaces: Top level organization (Personal, Company X)
create table public.workspaces (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  owner_id uuid references auth.users(id) not null
);

-- Projects: Belong to a workspace
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null -- Creator
);

-- Columns: Kanban columns for a project (e.g., Todo, In Progress)
create table public.columns (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  order_index integer not null default 0,
  project_id uuid references public.projects(id) on delete cascade not null
);

-- Tasks: The actual items
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  column_id uuid references public.columns(id) on delete cascade not null,
  order_index integer not null default 0,
  project_id uuid references public.projects(id) on delete cascade not null,
  assignee_id uuid references auth.users(id)
);

-- RLS Policies (Simple version for single user/owner for now)
alter table public.workspaces enable row level security;
create policy "Users can view their own workspaces" on public.workspaces for select using (auth.uid() = owner_id);
create policy "Users can insert their own workspaces" on public.workspaces for insert with check (auth.uid() = owner_id);
create policy "Users can update their own workspaces" on public.workspaces for update using (auth.uid() = owner_id);

alter table public.projects enable row level security;
create policy "Users can view their own projects" on public.projects for select using (auth.uid() = user_id);
create policy "Users can insert their own projects" on public.projects for insert with check (auth.uid() = user_id);
create policy "Users can update their own projects" on public.projects for update using (auth.uid() = user_id);

alter table public.columns enable row level security;
create policy "Users can view columns of their projects" on public.columns for select using (
  exists (select 1 from public.projects where projects.id = columns.project_id and projects.user_id = auth.uid())
);
create policy "Users can insert columns to their projects" on public.columns for insert with check (
  exists (select 1 from public.projects where projects.id = columns.project_id and projects.user_id = auth.uid())
);

alter table public.tasks enable row level security;
create policy "Users can view tasks of their projects" on public.tasks for select using (
  exists (select 1 from public.projects where projects.id = tasks.project_id and projects.user_id = auth.uid())
);
create policy "Users can insert tasks to their projects" on public.tasks for insert with check (
  exists (select 1 from public.projects where projects.id = tasks.project_id and projects.user_id = auth.uid())
);
create policy "Users can update tasks of their projects" on public.tasks for update using (
  exists (select 1 from public.projects where projects.id = tasks.project_id and projects.user_id = auth.uid())
);

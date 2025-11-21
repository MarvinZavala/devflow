-- Add completed_at column to tasks table
alter table public.tasks add column completed_at timestamp with time zone;

-- Optional: Backfill existing 'Done' tasks (This is tricky without knowing which column is 'Done' by ID, 
-- but we can try if you know the column IDs. For now, we leave it null for old tasks).

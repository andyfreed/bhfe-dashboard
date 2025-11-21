-- Add tags, color, and sort_order to todos table
ALTER TABLE public.todos 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add user_color to profiles table for user-specific colors
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_color TEXT DEFAULT '#3b82f6';

-- Create index for sort_order to improve sorting performance
CREATE INDEX IF NOT EXISTS idx_todos_sort_order ON public.todos(sort_order);

-- Update existing todos to have a sort_order based on created_at
UPDATE public.todos
SET sort_order = EXTRACT(EPOCH FROM created_at)::INTEGER
WHERE sort_order = 0;


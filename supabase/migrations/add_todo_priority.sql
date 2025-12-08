-- Add priority field to todos table
ALTER TABLE public.todos 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));

-- Create index for priority to improve filtering performance
CREATE INDEX IF NOT EXISTS idx_todos_priority ON public.todos(priority);

-- Update existing todos to have medium priority
UPDATE public.todos
SET priority = 'medium'
WHERE priority IS NULL;


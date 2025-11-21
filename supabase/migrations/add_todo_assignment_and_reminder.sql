-- Migration: Add assignment and reminder integration to todos
-- Run this in your Supabase SQL editor

-- Add assigned_to field to todos (can be assigned to a different user)
ALTER TABLE public.todos 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add reminder_date field to todos (for reminder integration)
ALTER TABLE public.todos 
ADD COLUMN IF NOT EXISTS reminder_date TIMESTAMP WITH TIME ZONE;

-- Add todo_id field to reminders (to link reminders back to todos)
ALTER TABLE public.reminders
ADD COLUMN IF NOT EXISTS todo_id UUID REFERENCES public.todos(id) ON DELETE CASCADE;

-- Create index for assigned_to
CREATE INDEX IF NOT EXISTS idx_todos_assigned_to ON public.todos(assigned_to);

-- Create index for todo_id in reminders
CREATE INDEX IF NOT EXISTS idx_reminders_todo_id ON public.reminders(todo_id);


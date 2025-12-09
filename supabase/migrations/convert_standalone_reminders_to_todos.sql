-- Migration: Convert standalone reminders to todos and add super reminder support
-- This migration converts all reminders that are NOT linked to a todo (todo_id IS NULL) into todo items
-- It also adds is_super_reminder support to todos

-- Step 1: Add is_super_reminder field to todos table
ALTER TABLE public.todos
ADD COLUMN IF NOT EXISTS is_super_reminder BOOLEAN DEFAULT FALSE;

-- Step 2: Convert standalone reminders (todo_id IS NULL) to todos
-- For each standalone reminder, create a corresponding todo item
INSERT INTO public.todos (
  id,
  user_id,
  title,
  description,
  completed,
  due_date,
  reminder_date,
  is_recurring,
  recurring_pattern,
  is_company_task,
  is_super_reminder,
  assigned_to,
  priority,
  created_at,
  updated_at,
  sort_order
)
SELECT 
  r.id,  -- Use the reminder's ID so we maintain the relationship
  r.user_id,
  r.title,
  r.description,
  r.is_completed,  -- Map is_completed to completed
  r.reminder_date,  -- Use reminder_date as due_date
  r.reminder_date,  -- Also set as reminder_date
  r.is_recurring,
  r.recurring_pattern,
  true,  -- All todos are company todos
  COALESCE(r.is_super_reminder, false),  -- Transfer super reminder flag
  NULL,  -- Standalone reminders are not assigned
  'medium',  -- Default priority
  r.created_at,
  r.updated_at,
  EXTRACT(EPOCH FROM r.created_at)::INTEGER  -- Use created_at timestamp as sort_order
FROM public.reminders r
WHERE r.todo_id IS NULL  -- Only standalone reminders
ON CONFLICT (id) DO NOTHING;  -- Skip if todo with same ID already exists

-- Note: We keep the reminders table and existing reminders linked to todos (todo_id IS NOT NULL)
-- for backwards compatibility. The reminders page will be removed from the UI,
-- but data remains in the database.


-- Migration: Allow users to create reminders for todos they created or are assigned to
-- Run this in your Supabase SQL editor

-- Drop existing INSERT policy for reminders
DROP POLICY IF EXISTS "Users can create reminders" ON public.reminders;

-- Create new INSERT policy that allows:
-- 1. Users creating reminders for themselves (user_id = auth.uid())
-- 2. Users creating reminders for todos they created (todo.user_id = auth.uid())
-- 3. Users creating reminders for todos assigned to them (todo.assigned_to = auth.uid())
CREATE POLICY "Users can create reminders for themselves or assigned todos" ON public.reminders FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.todos 
      WHERE todos.id = reminders.todo_id 
      AND (todos.user_id = auth.uid() OR todos.assigned_to = auth.uid())
    )
  );

-- Also update SELECT policy to allow users to see reminders for todos assigned to them
DROP POLICY IF EXISTS "Users can view their own reminders" ON public.reminders;

CREATE POLICY "Users can view their own reminders or reminders for assigned todos" ON public.reminders FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.todos 
      WHERE todos.id = reminders.todo_id 
      AND todos.assigned_to = auth.uid()
    )
  );


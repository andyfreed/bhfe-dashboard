-- Migration: Allow users to view all reminders (for the toggle feature)
-- Run this in your Supabase SQL editor

-- Drop existing SELECT policy for reminders
DROP POLICY IF EXISTS "Users can view their own reminders or reminders for assigned todos" ON public.reminders;
DROP POLICY IF EXISTS "Users can view their own reminders" ON public.reminders;

-- Create new SELECT policy that allows viewing all reminders
CREATE POLICY "Users can view all reminders" ON public.reminders FOR SELECT 
  USING (true);


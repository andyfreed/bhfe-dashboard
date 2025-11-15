-- Migration: Make dashboard sections accessible to all users
-- Run this in your Supabase SQL editor to update RLS policies

-- Drop existing policies for calendar_events
DROP POLICY IF EXISTS "Users can update their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can delete their own calendar events" ON public.calendar_events;

-- Create new policies for calendar_events (shared across all users)
CREATE POLICY "Users can update all calendar events" ON public.calendar_events FOR UPDATE 
  USING (true);
CREATE POLICY "Users can delete all calendar events" ON public.calendar_events FOR DELETE 
  USING (true);

-- Drop existing policies for projects
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- Create new policies for projects (shared across all users)
CREATE POLICY "Users can update all projects" ON public.projects FOR UPDATE 
  USING (true);
CREATE POLICY "Users can delete all projects" ON public.projects FOR DELETE 
  USING (true);

-- Drop existing policies for notes
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;

-- Create new policies for notes (shared across all users)
CREATE POLICY "Users can view all notes" ON public.notes FOR SELECT 
  USING (true);
CREATE POLICY "Users can update all notes" ON public.notes FOR UPDATE 
  USING (true);
CREATE POLICY "Users can delete all notes" ON public.notes FOR DELETE 
  USING (true);

-- Drop existing policies for links
DROP POLICY IF EXISTS "Users can update their own links" ON public.links;
DROP POLICY IF EXISTS "Users can delete their own links" ON public.links;

-- Create new policies for links (shared across all users)
CREATE POLICY "Users can update all links" ON public.links FOR UPDATE 
  USING (true);
CREATE POLICY "Users can delete all links" ON public.links FOR DELETE 
  USING (true);


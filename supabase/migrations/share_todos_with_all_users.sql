-- Migration: Make todos accessible to all users
-- Run this in your Supabase SQL editor to update RLS policies

-- Drop existing SELECT policy for todos
DROP POLICY IF EXISTS "Users can view their own todos and company todos" ON public.todos;

-- Create new SELECT policy for todos (shared across all users)
CREATE POLICY "Users can view all todos" ON public.todos FOR SELECT 
  USING (true);

-- Drop existing UPDATE policy for todos
DROP POLICY IF EXISTS "Users can update their own todos and company todos" ON public.todos;

-- Create new UPDATE policy for todos (shared across all users)
CREATE POLICY "Users can update all todos" ON public.todos FOR UPDATE 
  USING (true);


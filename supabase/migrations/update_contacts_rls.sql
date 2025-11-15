-- Migration: Update contacts RLS policies to allow all users to access all contacts
-- Run this in your Supabase SQL editor to update the existing policies

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts;

-- Create new policies that allow all users to view, update, and delete all contacts
CREATE POLICY "Users can view all contacts" ON public.contacts FOR SELECT 
  USING (true);

CREATE POLICY "Users can update all contacts" ON public.contacts FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete all contacts" ON public.contacts FOR DELETE 
  USING (true);

-- Note: The INSERT policy remains the same (users can create contacts with their own user_id)


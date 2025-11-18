-- Migration: Add is_super_reminder field to reminders table
-- Run this in your Supabase SQL editor to add the is_super_reminder column

ALTER TABLE public.reminders
ADD COLUMN IF NOT EXISTS is_super_reminder BOOLEAN DEFAULT FALSE;


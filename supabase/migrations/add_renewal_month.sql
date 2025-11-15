-- Migration: Add renewal_month field to state_info table
-- Run this in your Supabase SQL editor to add the renewal_month column

ALTER TABLE public.state_info
ADD COLUMN IF NOT EXISTS renewal_month TEXT;


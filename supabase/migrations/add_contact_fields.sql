-- Migration: Add email_2, phone_2, website, and fpa_chapter fields to contacts table
-- Run this in your Supabase SQL editor to add the new columns to existing tables

ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS email_2 TEXT,
ADD COLUMN IF NOT EXISTS phone_2 TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS fpa_chapter TEXT;


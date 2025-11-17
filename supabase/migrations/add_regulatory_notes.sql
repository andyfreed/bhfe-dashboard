-- Migration: Add regulatory notes fields to state_info table
-- This adds fields for CFP, EA/OTRP/ERPA, CDFA, and IAR notes

ALTER TABLE public.state_info
ADD COLUMN IF NOT EXISTS cfp_notes TEXT,
ADD COLUMN IF NOT EXISTS ea_otrp_erpa_notes TEXT,
ADD COLUMN IF NOT EXISTS cdfa_notes TEXT,
ADD COLUMN IF NOT EXISTS iar_notes TEXT;


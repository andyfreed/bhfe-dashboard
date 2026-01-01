CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.cpa_state_cpe_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state_code TEXT NOT NULL UNIQUE,
  state_name TEXT,
  schema_version TEXT NOT NULL DEFAULT 'cpa_cpe_v1',
  effective_date DATE,
  source_title TEXT,
  source_url TEXT,
  source_text TEXT NOT NULL,
  extracted_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  extracted_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  model_name TEXT,
  extraction_confidence NUMERIC,
  needs_human_review BOOLEAN NOT NULL DEFAULT FALSE,
  reporting_period_type TEXT NOT NULL DEFAULT 'unknown',
  reporting_period_length_months INTEGER,
  reporting_period_start_rule TEXT,
  reporting_period_end_rule TEXT,
  reporting_period_examples JSONB,
  total_hours_required NUMERIC,
  accrual_method TEXT NOT NULL DEFAULT 'unknown',
  accrual_rate_hours NUMERIC,
  accrual_rate_period TEXT,
  prorating_rules TEXT,
  completion_deadline_rule TEXT,
  completion_deadline_anchor TEXT,
  late_policy_summary TEXT,
  category_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  delivery_constraints JSONB NOT NULL DEFAULT '[]'::jsonb,
  carryover_allowed BOOLEAN,
  carryover_max_hours NUMERIC,
  carryover_notes TEXT,
  initial_license_rules TEXT,
  inactive_status_rules TEXT,
  reactivation_reinstatement_rules TEXT,
  audit_policy_summary TEXT,
  record_retention_years INTEGER,
  other_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  plain_english_summary TEXT,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT state_code_format CHECK (state_code ~ '^[A-Z]{2}$')
);

ALTER TABLE public.cpa_state_cpe_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view CPA state CPE requirements"
  ON public.cpa_state_cpe_requirements
  FOR SELECT USING (true);

CREATE POLICY "Users can insert CPA state CPE requirements"
  ON public.cpa_state_cpe_requirements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update CPA state CPE requirements"
  ON public.cpa_state_cpe_requirements
  FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_cpa_state_cpe_requirements_needs_review
  ON public.cpa_state_cpe_requirements (needs_human_review);

CREATE INDEX IF NOT EXISTS idx_cpa_state_cpe_requirements_extracted_at_desc
  ON public.cpa_state_cpe_requirements (extracted_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'update_updated_at_column'
      AND pg_function_is_visible(oid)
  ) THEN
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS trigger AS $func$
    BEGIN
      NEW.updated_at = TIMEZONE('utc'::text, NOW());
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END;
$$;

CREATE TRIGGER update_cpa_state_cpe_requirements_updated_at
  BEFORE UPDATE ON public.cpa_state_cpe_requirements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


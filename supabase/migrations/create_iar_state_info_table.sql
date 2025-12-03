-- Create IAR state-specific regulatory information table
CREATE TABLE IF NOT EXISTS public.iar_state_info (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  state_code TEXT NOT NULL UNIQUE,
  state_name TEXT NOT NULL,
  ce_requirements TEXT,
  renewal_period TEXT,
  renewal_month TEXT,
  contact_info TEXT,
  website_url TEXT,
  notes TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.iar_state_info ENABLE ROW LEVEL SECURITY;

-- RLS Policies for iar_state_info
CREATE POLICY "Users can view IAR state info" ON public.iar_state_info FOR SELECT USING (true);
CREATE POLICY "Users can update IAR state info" ON public.iar_state_info FOR UPDATE USING (true);
CREATE POLICY "Users can insert IAR state info" ON public.iar_state_info FOR INSERT WITH CHECK (true);


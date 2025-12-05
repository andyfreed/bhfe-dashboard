-- Create app_settings table for global application settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies - All authenticated users can view and update settings
CREATE POLICY "Users can view all settings" ON public.app_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update all settings" ON public.app_settings
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert settings" ON public.app_settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Insert default unassigned todo color
INSERT INTO public.app_settings (key, value, description)
VALUES ('unassigned_todo_color', '#9ca3af', 'Color for unassigned todos')
ON CONFLICT (key) DO NOTHING;

-- Create index for key lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(key);


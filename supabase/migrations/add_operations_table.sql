-- Migration: Create operations table for tracking technical business information
-- This table stores information about domains, hosting, WordPress plugins, services, etc.

CREATE TABLE IF NOT EXISTS public.operations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category TEXT NOT NULL, -- 'Domain', 'Hosting', 'WordPress Plugin', 'Service', 'Other'
  title TEXT NOT NULL,
  description TEXT,
  details TEXT, -- Additional details, notes, configuration info
  cost TEXT, -- e.g., "$99/year" or "$9.99/month"
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Policies for operations
CREATE POLICY "Users can view all operations" ON public.operations FOR SELECT USING (true);
CREATE POLICY "Users can create operations" ON public.operations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update all operations" ON public.operations FOR UPDATE USING (true);
CREATE POLICY "Users can delete all operations" ON public.operations FOR DELETE USING (true);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_operations_updated_at BEFORE UPDATE ON public.operations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create todos table
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMP WITH TIME ZONE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_pattern TEXT, -- 'daily', 'weekly', 'monthly', 'yearly'
  recurring_interval INTEGER DEFAULT 1,
  is_company_task BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  all_day BOOLEAN DEFAULT FALSE,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_pattern TEXT,
  recurring_interval INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'on_hold'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create project_sections table
CREATE TABLE IF NOT EXISTS public.project_sections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  email_2 TEXT,
  phone TEXT,
  phone_2 TEXT,
  website TEXT,
  fpa_chapter TEXT,
  state TEXT,
  company TEXT,
  title TEXT,
  notes TEXT,
  tags TEXT[], -- Array of tags
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create notes table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[],
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create state_info table for CPE/CE regulations
CREATE TABLE IF NOT EXISTS public.state_info (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  state_code TEXT NOT NULL UNIQUE, -- 'AL', 'AK', etc.
  state_name TEXT NOT NULL,
  cpe_requirements TEXT,
  ce_requirements TEXT,
  renewal_period TEXT,
  renewal_month TEXT,
  contact_info TEXT,
  website_url TEXT,
  notes TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_by UUID REFERENCES auth.users(id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create links table
CREATE TABLE IF NOT EXISTS public.links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Icon name or URL
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON public.todos(due_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON public.calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_reminder_date ON public.reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver_id ON public.chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON public.links(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.state_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for todos
CREATE POLICY "Users can view their own todos and company todos" ON public.todos FOR SELECT 
  USING (auth.uid() = user_id OR is_company_task = true);
CREATE POLICY "Users can create todos" ON public.todos FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own todos and company todos" ON public.todos FOR UPDATE 
  USING (auth.uid() = user_id OR is_company_task = true);
CREATE POLICY "Users can delete their own todos" ON public.todos FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for calendar_events (shared across all users)
CREATE POLICY "Users can view all calendar events" ON public.calendar_events FOR SELECT USING (true);
CREATE POLICY "Users can create calendar events" ON public.calendar_events FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update all calendar events" ON public.calendar_events FOR UPDATE 
  USING (true);
CREATE POLICY "Users can delete all calendar events" ON public.calendar_events FOR DELETE 
  USING (true);

-- RLS Policies for reminders
CREATE POLICY "Users can view their own reminders" ON public.reminders FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create reminders" ON public.reminders FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reminders" ON public.reminders FOR UPDATE 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reminders" ON public.reminders FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for projects (shared across all users)
CREATE POLICY "Users can view all projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update all projects" ON public.projects FOR UPDATE 
  USING (true);
CREATE POLICY "Users can delete all projects" ON public.projects FOR DELETE 
  USING (true);

-- RLS Policies for project_sections
CREATE POLICY "Users can view project sections" ON public.project_sections FOR SELECT USING (true);
CREATE POLICY "Users can create project sections" ON public.project_sections FOR INSERT 
  WITH CHECK (true);
CREATE POLICY "Users can update project sections" ON public.project_sections FOR UPDATE 
  USING (true);
CREATE POLICY "Users can delete project sections" ON public.project_sections FOR DELETE 
  USING (true);

-- RLS Policies for contacts (shared across all users)
CREATE POLICY "Users can view all contacts" ON public.contacts FOR SELECT 
  USING (true);
CREATE POLICY "Users can create contacts" ON public.contacts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update all contacts" ON public.contacts FOR UPDATE 
  USING (true);
CREATE POLICY "Users can delete all contacts" ON public.contacts FOR DELETE 
  USING (true);

-- RLS Policies for notes (shared across all users)
CREATE POLICY "Users can view all notes" ON public.notes FOR SELECT 
  USING (true);
CREATE POLICY "Users can create notes" ON public.notes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update all notes" ON public.notes FOR UPDATE 
  USING (true);
CREATE POLICY "Users can delete all notes" ON public.notes FOR DELETE 
  USING (true);

-- RLS Policies for state_info
CREATE POLICY "Users can view state info" ON public.state_info FOR SELECT USING (true);
CREATE POLICY "Users can update state info" ON public.state_info FOR UPDATE USING (true);
CREATE POLICY "Users can insert state info" ON public.state_info FOR INSERT WITH CHECK (true);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view their own messages" ON public.chat_messages FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can create messages" ON public.chat_messages FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update messages they received" ON public.chat_messages FOR UPDATE 
  USING (auth.uid() = receiver_id);

-- RLS Policies for links (shared across all users)
CREATE POLICY "Users can view all links" ON public.links FOR SELECT USING (true);
CREATE POLICY "Users can create links" ON public.links FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update all links" ON public.links FOR UPDATE 
  USING (true);
CREATE POLICY "Users can delete all links" ON public.links FOR DELETE 
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_links_updated_at BEFORE UPDATE ON public.links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


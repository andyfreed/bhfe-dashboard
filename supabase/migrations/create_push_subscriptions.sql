-- Migration: Create push_subscriptions table for Web Push API
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(endpoint) -- One subscription per endpoint
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);

-- Enable Row Level Security
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_subscriptions
CREATE POLICY "Users can view their own push subscriptions" ON public.push_subscriptions FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own push subscriptions" ON public.push_subscriptions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own push subscriptions" ON public.push_subscriptions FOR UPDATE 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own push subscriptions" ON public.push_subscriptions FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Migration: Add DELETE policy for chat_messages table
-- This allows users to delete chat messages where they are the sender or receiver
-- Run this in your Supabase SQL editor

CREATE POLICY "Users can delete messages they sent or received" ON public.chat_messages FOR DELETE 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);


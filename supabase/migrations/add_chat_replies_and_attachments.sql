-- Add message grouping and reply support for chat messages
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS message_group_id UUID;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reply_to_group_id UUID;

CREATE INDEX IF NOT EXISTS idx_chat_messages_group_id ON public.chat_messages(message_group_id);

-- Create chat_attachments table for uploaded files
CREATE TABLE IF NOT EXISTS public.chat_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_group_id UUID NOT NULL,
  uploader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes BIGINT,
  content_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_attachments_group_id ON public.chat_attachments(message_group_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_uploader_id ON public.chat_attachments(uploader_id);

ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments in their chats" ON public.chat_attachments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.chat_messages m
    WHERE m.message_group_id = chat_attachments.message_group_id
      AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
  ));

CREATE POLICY "Users can create their own attachments" ON public.chat_attachments FOR INSERT
  WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY "Users can delete their own attachments" ON public.chat_attachments FOR DELETE
  USING (auth.uid() = uploader_id);

-- Storage bucket + policies for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Authenticated users can upload chat attachments" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update chat attachments" ON storage.objects FOR UPDATE
  USING (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete chat attachments" ON storage.objects FOR DELETE
  USING (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can read chat attachments" ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-attachments');

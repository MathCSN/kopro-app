-- Create vault_documents table for personal secure documents
CREATE TABLE public.vault_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  category TEXT DEFAULT 'general',
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vault_documents ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own vault documents
CREATE POLICY "Users can view their own vault documents"
ON public.vault_documents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vault documents"
ON public.vault_documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vault documents"
ON public.vault_documents
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vault documents"
ON public.vault_documents
FOR DELETE
USING (auth.uid() = user_id);

-- Add message_type column to messages table for advanced messaging
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'normal';

-- Add is_broadcast column to conversations for multi-residence announcements  
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_broadcast BOOLEAN DEFAULT false;

-- Create storage bucket for vault documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vault', 'vault', false)
ON CONFLICT (id) DO NOTHING;

-- Vault storage policies - users can only access their own folder
CREATE POLICY "Users can view their own vault files"
ON storage.objects FOR SELECT
USING (bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload to their own vault folder"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own vault files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own vault files"
ON storage.objects FOR DELETE
USING (bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1]);
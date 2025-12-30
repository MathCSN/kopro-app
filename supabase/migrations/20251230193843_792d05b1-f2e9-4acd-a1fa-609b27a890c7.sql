-- Table pour les paramètres IA par résidence
CREATE TABLE public.residence_ai_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  welcome_message TEXT DEFAULT 'Bonjour ! Je suis votre assistant résidence. Comment puis-je vous aider ?',
  fallback_contact_name TEXT,
  fallback_contact_email TEXT,
  fallback_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(residence_id)
);

-- Table pour les documents IA (base de connaissances)
CREATE TABLE public.ai_knowledge_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  content_text TEXT, -- Contenu extrait pour la recherche
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour l'historique des conversations IA
CREATE TABLE public.ai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.ai_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.residence_ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for residence_ai_settings
CREATE POLICY "Managers can manage AI settings"
ON public.residence_ai_settings FOR ALL
USING (can_manage_rental(auth.uid(), residence_id));

CREATE POLICY "Residents can view AI settings"
ON public.residence_ai_settings FOR SELECT
USING (has_residence_access(auth.uid(), residence_id));

-- RLS Policies for ai_knowledge_documents
CREATE POLICY "Managers can manage knowledge docs"
ON public.ai_knowledge_documents FOR ALL
USING (can_manage_rental(auth.uid(), residence_id));

CREATE POLICY "Residents can view knowledge docs"
ON public.ai_knowledge_documents FOR SELECT
USING (has_residence_access(auth.uid(), residence_id));

-- RLS Policies for ai_conversations
CREATE POLICY "Users can manage their own conversations"
ON public.ai_conversations FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "Managers can view all conversations"
ON public.ai_conversations FOR SELECT
USING (can_manage_rental(auth.uid(), residence_id));

-- RLS Policies for ai_messages
CREATE POLICY "Users can view messages from their conversations"
ON public.ai_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.ai_conversations c 
  WHERE c.id = ai_messages.conversation_id 
  AND c.user_id = auth.uid()
));

CREATE POLICY "Users can insert messages to their conversations"
ON public.ai_messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.ai_conversations c 
  WHERE c.id = ai_messages.conversation_id 
  AND c.user_id = auth.uid()
));

CREATE POLICY "Managers can view all messages"
ON public.ai_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.ai_conversations c 
  WHERE c.id = ai_messages.conversation_id 
  AND can_manage_rental(auth.uid(), c.residence_id)
));

-- Create storage bucket for AI documents
INSERT INTO storage.buckets (id, name, public) VALUES ('ai-documents', 'ai-documents', false);

-- Storage policies
CREATE POLICY "Managers can upload AI docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ai-documents' AND can_manage_rental(auth.uid(), (storage.foldername(name))[1]::uuid));

CREATE POLICY "Managers can manage AI docs"
ON storage.objects FOR ALL
USING (bucket_id = 'ai-documents' AND can_manage_rental(auth.uid(), (storage.foldername(name))[1]::uuid));

CREATE POLICY "Residents can view AI docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'ai-documents' AND has_residence_access(auth.uid(), (storage.foldername(name))[1]::uuid));
-- Table pour les tickets/incidents
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  assignee_id UUID REFERENCES auth.users(id),
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tickets in their residence" ON public.tickets
  FOR SELECT USING (has_residence_access(auth.uid(), residence_id));

CREATE POLICY "Users can create tickets in their residence" ON public.tickets
  FOR INSERT WITH CHECK (has_residence_access(auth.uid(), residence_id));

CREATE POLICY "Managers can manage tickets" ON public.tickets
  FOR ALL USING (can_manage_rental(auth.uid(), residence_id));

CREATE POLICY "Users can update their own tickets" ON public.tickets
  FOR UPDATE USING (created_by = auth.uid());

-- Table pour les réservations d'espaces communs
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  resource_name TEXT NOT NULL,
  resource_type TEXT DEFAULT 'common_space',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reservations in their residence" ON public.reservations
  FOR SELECT USING (has_residence_access(auth.uid(), residence_id));

CREATE POLICY "Users can create their own reservations" ON public.reservations
  FOR INSERT WITH CHECK (user_id = auth.uid() AND has_residence_access(auth.uid(), residence_id));

CREATE POLICY "Users can update their own reservations" ON public.reservations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Managers can manage all reservations" ON public.reservations
  FOR ALL USING (can_manage_rental(auth.uid(), residence_id));

-- Table pour les documents
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents in their residence" ON public.documents
  FOR SELECT USING (has_residence_access(auth.uid(), residence_id));

CREATE POLICY "Managers can manage documents" ON public.documents
  FOR ALL USING (can_manage_rental(auth.uid(), residence_id));

-- Table pour les colis
CREATE TABLE public.packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id),
  recipient_name TEXT NOT NULL,
  recipient_unit TEXT,
  carrier TEXT,
  tracking_number TEXT,
  status TEXT DEFAULT 'received',
  received_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  collected_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own packages" ON public.packages
  FOR SELECT USING (recipient_id = auth.uid() OR can_manage_rental(auth.uid(), residence_id));

CREATE POLICY "Managers can manage packages" ON public.packages
  FOR ALL USING (can_manage_rental(auth.uid(), residence_id));

-- Table pour les visiteurs
CREATE TABLE public.visitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES auth.users(id),
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT,
  visitor_email TEXT,
  purpose TEXT,
  expected_at TIMESTAMP WITH TIME ZONE,
  arrived_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'expected',
  access_code TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own visitors" ON public.visitors
  FOR SELECT USING (host_id = auth.uid() OR can_manage_rental(auth.uid(), residence_id));

CREATE POLICY "Users can create their own visitors" ON public.visitors
  FOR INSERT WITH CHECK (host_id = auth.uid() AND has_residence_access(auth.uid(), residence_id));

CREATE POLICY "Users can update their own visitors" ON public.visitors
  FOR UPDATE USING (host_id = auth.uid());

CREATE POLICY "Managers can manage all visitors" ON public.visitors
  FOR ALL USING (can_manage_rental(auth.uid(), residence_id));

-- Table pour les AG (Assemblées Générales)
CREATE TABLE public.general_assemblies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'scheduled',
  agenda JSONB DEFAULT '[]',
  minutes_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.general_assemblies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AG in their residence" ON public.general_assemblies
  FOR SELECT USING (has_residence_access(auth.uid(), residence_id));

CREATE POLICY "Managers can manage AG" ON public.general_assemblies
  FOR ALL USING (can_manage_rental(auth.uid(), residence_id));

-- Table pour les votes AG
CREATE TABLE public.ag_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assembly_id UUID NOT NULL REFERENCES public.general_assemblies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  resolution_index INTEGER NOT NULL,
  vote TEXT NOT NULL,
  proxy_for UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assembly_id, user_id, resolution_index)
);

ALTER TABLE public.ag_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own votes" ON public.ag_votes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can cast their own votes" ON public.ag_votes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Managers can view all votes" ON public.ag_votes
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.general_assemblies ga 
    WHERE ga.id = ag_votes.assembly_id 
    AND can_manage_rental(auth.uid(), ga.residence_id)
  ));

-- Table pour les paiements
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  lot_id UUID REFERENCES public.lots(id),
  amount NUMERIC NOT NULL,
  type TEXT DEFAULT 'rent',
  description TEXT,
  due_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (user_id = auth.uid() OR can_manage_rental(auth.uid(), residence_id));

CREATE POLICY "Managers can manage payments" ON public.payments
  FOR ALL USING (can_manage_rental(auth.uid(), residence_id));

-- Table pour les annonces marketplace
CREATE TABLE public.marketplace_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  category TEXT DEFAULT 'other',
  condition TEXT DEFAULT 'good',
  images JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view listings in their residence" ON public.marketplace_listings
  FOR SELECT USING (has_residence_access(auth.uid(), residence_id));

CREATE POLICY "Users can create their own listings" ON public.marketplace_listings
  FOR INSERT WITH CHECK (seller_id = auth.uid() AND has_residence_access(auth.uid(), residence_id));

CREATE POLICY "Users can update their own listings" ON public.marketplace_listings
  FOR UPDATE USING (seller_id = auth.uid());

CREATE POLICY "Users can delete their own listings" ON public.marketplace_listings
  FOR DELETE USING (seller_id = auth.uid());

-- Table pour les conversations/messages
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID REFERENCES public.residences(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'direct',
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Table des participants aux conversations
CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations" ON public.conversations
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = conversations.id 
    AND cp.user_id = auth.uid()
  ));

CREATE POLICY "Users can view their participations" ON public.conversation_participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can join conversations in their residence" ON public.conversation_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Table des messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = messages.conversation_id 
    AND cp.user_id = auth.uid()
  ));

CREATE POLICY "Users can send messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp 
      WHERE cp.conversation_id = messages.conversation_id 
      AND cp.user_id = auth.uid()
    )
  );

-- Table pour le newsfeed
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'announcement',
  attachments JSONB DEFAULT '[]',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view posts in their residence" ON public.posts
  FOR SELECT USING (has_residence_access(auth.uid(), residence_id));

CREATE POLICY "Users can create posts" ON public.posts
  FOR INSERT WITH CHECK (author_id = auth.uid() AND has_residence_access(auth.uid(), residence_id));

CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Managers can manage all posts" ON public.posts
  FOR ALL USING (can_manage_rental(auth.uid(), residence_id));

-- Triggers pour updated_at
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_visitors_updated_at BEFORE UPDATE ON public.visitors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_general_assemblies_updated_at BEFORE UPDATE ON public.general_assemblies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON public.marketplace_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
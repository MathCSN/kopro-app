-- =============================================
-- COLD EMAILING TABLES
-- =============================================

-- Table des campagnes d'emails
CREATE TABLE public.cold_email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  batch_size INTEGER DEFAULT 20,
  interval_minutes INTEGER DEFAULT 30,
  start_hour INTEGER DEFAULT 9,
  end_hour INTEGER DEFAULT 18,
  active_days JSONB DEFAULT '["monday","tuesday","wednesday","thursday","friday"]',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des destinataires
CREATE TABLE public.cold_email_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.cold_email_campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'bounced', 'unsubscribed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table blacklist emails
CREATE TABLE public.email_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- BUG REPORTS TABLE
-- =============================================

CREATE TABLE public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  type TEXT DEFAULT 'bug' CHECK (type IN ('bug', 'suggestion')),
  description TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  
  -- Données contextuelles
  current_url TEXT,
  screen_name TEXT,
  user_agent TEXT,
  device_model TEXT,
  os_version TEXT,
  app_version TEXT,
  account_type TEXT,
  
  -- Médias
  screenshot_url TEXT,
  video_url TEXT,
  attachments JSONB DEFAULT '[]',
  
  -- Admin notes
  admin_notes TEXT,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Cold Email Campaigns - Admin only
ALTER TABLE public.cold_email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cold email campaigns"
ON public.cold_email_campaigns
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Cold Email Recipients - Admin only
ALTER TABLE public.cold_email_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cold email recipients"
ON public.cold_email_recipients
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Email Blacklist - Admin only
ALTER TABLE public.email_blacklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email blacklist"
ON public.email_blacklist
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Bug Reports
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Users can create their own bug reports
CREATE POLICY "Users can create bug reports"
ON public.bug_reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own bug reports
CREATE POLICY "Users can view their own bug reports"
ON public.bug_reports
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'manager')
  )
);

-- Admins and managers can update bug reports
CREATE POLICY "Admins can update bug reports"
ON public.bug_reports
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'manager')
  )
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_cold_email_recipients_campaign ON public.cold_email_recipients(campaign_id);
CREATE INDEX idx_cold_email_recipients_status ON public.cold_email_recipients(status);
CREATE INDEX idx_cold_email_campaigns_status ON public.cold_email_campaigns(status);
CREATE INDEX idx_bug_reports_status ON public.bug_reports(status);
CREATE INDEX idx_bug_reports_user ON public.bug_reports(user_id);
CREATE INDEX idx_email_blacklist_email ON public.email_blacklist(email);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE TRIGGER update_cold_email_campaigns_updated_at
BEFORE UPDATE ON public.cold_email_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bug_reports_updated_at
BEFORE UPDATE ON public.bug_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
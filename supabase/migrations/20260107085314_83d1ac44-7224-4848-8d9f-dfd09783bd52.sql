-- Table des comptes en période d'essai (trial accounts)
CREATE TABLE public.trial_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT upper(substring(md5(random()::text) from 1 for 12)),
  agency_name TEXT,
  duration_days INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, expired, converted
  created_by UUID REFERENCES auth.users(id),
  user_id UUID REFERENCES auth.users(id), -- assigned when account is created
  agency_id UUID REFERENCES public.agencies(id), -- assigned when account is created
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trial_accounts ENABLE ROW LEVEL SECURITY;

-- Admin can manage all trial accounts
CREATE POLICY "Admins can manage trial accounts"
ON public.trial_accounts
FOR ALL
USING (public.is_admin(auth.uid()));

-- Users can view their own trial account
CREATE POLICY "Users can view their own trial"
ON public.trial_accounts
FOR SELECT
USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_trial_accounts_updated_at
  BEFORE UPDATE ON public.trial_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add trial_account_id to agencies for reference
ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS trial_account_id UUID REFERENCES public.trial_accounts(id);

-- Index for faster lookups
CREATE INDEX idx_trial_accounts_token ON public.trial_accounts(token);
CREATE INDEX idx_trial_accounts_status ON public.trial_accounts(status);
CREATE INDEX idx_trial_accounts_user_id ON public.trial_accounts(user_id);
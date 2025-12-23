-- Table for residence invitation codes
CREATE TABLE public.residence_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.residence_invitations ENABLE ROW LEVEL SECURITY;

-- Owners can manage invitations
CREATE POLICY "Owners can manage invitations"
ON public.residence_invitations
FOR ALL
USING (is_owner(auth.uid()));

-- Anyone can view active invitations by code (for validation)
CREATE POLICY "Anyone can view active invitations"
ON public.residence_invitations
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
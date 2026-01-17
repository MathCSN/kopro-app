-- Add 'syndic' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'syndic';

-- Table for tracking which syndics manage which residences
CREATE TABLE public.syndic_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syndic_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  UNIQUE(syndic_user_id, residence_id)
);

-- Table for syndic invitations (magic link system)
CREATE TABLE public.syndic_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  syndic_name TEXT,
  syndic_phone TEXT,
  token TEXT UNIQUE NOT NULL DEFAULT md5(gen_random_uuid()::text || clock_timestamp()::text),
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'))
);

-- Add ticket_type to tickets table for routing
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS ticket_type TEXT DEFAULT 'private' CHECK (ticket_type IN ('private', 'common'));

-- Add syndic_notified flag to track if syndic was notified
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS syndic_notified_at TIMESTAMP WITH TIME ZONE;

-- Add manager_can_intervene flag (for common tickets)
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS manager_intervention_enabled BOOLEAN DEFAULT true;

-- Enable RLS
ALTER TABLE public.syndic_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syndic_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for syndic_assignments
CREATE POLICY "Admins can manage all syndic assignments"
ON public.syndic_assignments FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Managers can view syndic assignments for their residences"
ON public.syndic_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('manager', 'admin')
    AND (ur.residence_id = syndic_assignments.residence_id OR ur.role = 'admin')
  )
);

CREATE POLICY "Managers can create syndic assignments for their residences"
ON public.syndic_assignments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('manager', 'admin')
    AND (ur.residence_id = residence_id OR ur.role = 'admin')
  )
);

CREATE POLICY "Syndics can view their own assignments"
ON public.syndic_assignments FOR SELECT
TO authenticated
USING (syndic_user_id = auth.uid());

-- RLS Policies for syndic_invitations
CREATE POLICY "Admins can manage all syndic invitations"
ON public.syndic_invitations FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Managers can manage invitations for their residences"
ON public.syndic_invitations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('manager', 'admin')
    AND (ur.residence_id = syndic_invitations.residence_id OR ur.role = 'admin')
  )
);

CREATE POLICY "Anyone can view invitation by token for acceptance"
ON public.syndic_invitations FOR SELECT
TO authenticated
USING (true);

-- Function to check if user is a syndic for a residence
CREATE OR REPLACE FUNCTION public.is_syndic_for_residence(_user_id UUID, _residence_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.syndic_assignments
    WHERE syndic_user_id = _user_id
    AND residence_id = _residence_id
    AND status = 'active'
  )
$$;

-- Function to get all residences for a syndic
CREATE OR REPLACE FUNCTION public.get_syndic_residences(_user_id UUID)
RETURNS TABLE(residence_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sa.residence_id
  FROM public.syndic_assignments sa
  WHERE sa.syndic_user_id = _user_id
  AND sa.status = 'active'
$$;

-- Update tickets RLS to allow syndics to see common tickets for their residences
CREATE POLICY "Syndics can view common tickets for their residences"
ON public.tickets FOR SELECT
TO authenticated
USING (
  ticket_type = 'common'
  AND public.is_syndic_for_residence(auth.uid(), residence_id)
);

CREATE POLICY "Syndics can update common tickets for their residences"
ON public.tickets FOR UPDATE
TO authenticated
USING (
  ticket_type = 'common'
  AND public.is_syndic_for_residence(auth.uid(), residence_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_syndic_assignments_user ON public.syndic_assignments(syndic_user_id);
CREATE INDEX IF NOT EXISTS idx_syndic_assignments_residence ON public.syndic_assignments(residence_id);
CREATE INDEX IF NOT EXISTS idx_syndic_invitations_token ON public.syndic_invitations(token);
CREATE INDEX IF NOT EXISTS idx_syndic_invitations_email ON public.syndic_invitations(email);
CREATE INDEX IF NOT EXISTS idx_tickets_type ON public.tickets(ticket_type);
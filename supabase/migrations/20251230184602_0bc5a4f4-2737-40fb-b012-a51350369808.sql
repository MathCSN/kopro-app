-- Create residence_invitations table to track invitations
CREATE TABLE public.residence_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'resident',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  invited_by UUID REFERENCES auth.users(id),
  accepted_by UUID REFERENCES auth.users(id),
  token TEXT UNIQUE DEFAULT md5(gen_random_uuid()::text || clock_timestamp()::text),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.residence_invitations ENABLE ROW LEVEL SECURITY;

-- Managers can manage invitations for their residence
CREATE POLICY "Managers can manage invitations"
ON public.residence_invitations
FOR ALL
USING (can_manage_rental(auth.uid(), residence_id));

-- Create index for faster lookups
CREATE INDEX idx_invitations_residence_id ON public.residence_invitations(residence_id);
CREATE INDEX idx_invitations_email ON public.residence_invitations(email);
CREATE INDEX idx_invitations_status ON public.residence_invitations(status);
CREATE INDEX idx_invitations_token ON public.residence_invitations(token);

-- Create trigger for updated_at
CREATE TRIGGER update_invitations_updated_at
BEFORE UPDATE ON public.residence_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
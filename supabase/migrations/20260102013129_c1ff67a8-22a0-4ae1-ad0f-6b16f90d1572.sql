-- Create agencies table to group managers and residences
CREATE TABLE public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  siret TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  logo_url TEXT,
  owner_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add agency_id to residences table
ALTER TABLE public.residences ADD COLUMN agency_id UUID REFERENCES public.agencies(id);

-- Add agency_id to user_roles for managers
ALTER TABLE public.user_roles ADD COLUMN agency_id UUID REFERENCES public.agencies(id);

-- Enable RLS on agencies
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agencies
CREATE POLICY "Admins can manage all agencies"
ON public.agencies
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Managers can view their own agency"
ON public.agencies
FOR SELECT
USING (owner_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.agency_id = agencies.id
  AND user_roles.role IN ('manager', 'cs')
));

-- Trigger for updated_at
CREATE TRIGGER update_agencies_updated_at
BEFORE UPDATE ON public.agencies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
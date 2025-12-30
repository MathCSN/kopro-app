-- Create table for SMTP configuration per residence
CREATE TABLE public.smtp_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  host TEXT NOT NULL,
  port INTEGER NOT NULL DEFAULT 587,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT,
  use_tls BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(residence_id)
);

-- Enable RLS
ALTER TABLE public.smtp_configs ENABLE ROW LEVEL SECURITY;

-- Only managers can manage SMTP configs
CREATE POLICY "Managers can manage SMTP configs" 
ON public.smtp_configs 
FOR ALL 
USING (can_manage_rental(auth.uid(), residence_id));

-- Create table for service providers directory
CREATE TABLE public.service_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID REFERENCES public.residences(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  website TEXT,
  description TEXT,
  rating NUMERIC(2,1) CHECK (rating >= 0 AND rating <= 5),
  is_recommended BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

-- Anyone can view providers (global or for their residence)
CREATE POLICY "Users can view service providers" 
ON public.service_providers 
FOR SELECT 
USING (residence_id IS NULL OR has_residence_access(auth.uid(), residence_id));

-- Managers can manage providers for their residence
CREATE POLICY "Managers can manage service providers" 
ON public.service_providers 
FOR ALL 
USING (can_manage_rental(auth.uid(), residence_id));

-- Owners can manage global providers
CREATE POLICY "Owners can manage global providers" 
ON public.service_providers 
FOR ALL 
USING (is_owner(auth.uid()) AND residence_id IS NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_smtp_configs_updated_at
BEFORE UPDATE ON public.smtp_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_providers_updated_at
BEFORE UPDATE ON public.service_providers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
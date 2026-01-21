-- Create agency_custom_roles table for agency-defined roles
CREATE TABLE public.agency_custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, name)
);

-- Create custom_role_permissions table for permissions per custom role
CREATE TABLE public.custom_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_role_id UUID NOT NULL REFERENCES public.agency_custom_roles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(custom_role_id, permission_key)
);

-- Add custom_role_id to user_roles to link users to custom roles
ALTER TABLE public.user_roles
ADD COLUMN custom_role_id UUID REFERENCES public.agency_custom_roles(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.agency_custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_role_permissions ENABLE ROW LEVEL SECURITY;

-- Function to check if user belongs to agency (owner or team member)
CREATE OR REPLACE FUNCTION public.user_belongs_to_agency(_user_id uuid, _agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- User is agency owner
    SELECT 1 FROM public.agencies WHERE id = _agency_id AND owner_id = _user_id
    UNION
    -- User has a role with this agency (via residence belonging to agency)
    SELECT 1 FROM public.user_roles ur
    JOIN public.residences r ON ur.residence_id = r.id
    WHERE ur.user_id = _user_id AND r.agency_id = _agency_id
  )
$$;

-- RLS policies for agency_custom_roles
-- Admins can do everything
CREATE POLICY "Admins can manage all custom roles"
ON public.agency_custom_roles
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Agency members can view their agency's roles
CREATE POLICY "Agency members can view their roles"
ON public.agency_custom_roles
FOR SELECT
TO authenticated
USING (public.user_belongs_to_agency(auth.uid(), agency_id));

-- Agency owner can manage roles
CREATE POLICY "Agency owner can manage roles"
ON public.agency_custom_roles
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.agencies WHERE id = agency_id AND owner_id = auth.uid())
);

-- RLS policies for custom_role_permissions
-- Admins can do everything
CREATE POLICY "Admins can manage all role permissions"
ON public.custom_role_permissions
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Agency members can view permissions for their agency's roles
CREATE POLICY "Agency members can view role permissions"
ON public.custom_role_permissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.agency_custom_roles acr
    WHERE acr.id = custom_role_id
    AND public.user_belongs_to_agency(auth.uid(), acr.agency_id)
  )
);

-- Agency owner can manage permissions
CREATE POLICY "Agency owner can manage role permissions"
ON public.custom_role_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.agency_custom_roles acr
    JOIN public.agencies a ON a.id = acr.agency_id
    WHERE acr.id = custom_role_id AND a.owner_id = auth.uid()
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_agency_custom_roles_updated_at
BEFORE UPDATE ON public.agency_custom_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user has a specific permission via custom role
CREATE OR REPLACE FUNCTION public.has_custom_permission(_user_id uuid, _permission_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.custom_role_permissions crp ON crp.custom_role_id = ur.custom_role_id
    WHERE ur.user_id = _user_id
      AND crp.permission_key = _permission_key
      AND crp.enabled = true
  )
$$;
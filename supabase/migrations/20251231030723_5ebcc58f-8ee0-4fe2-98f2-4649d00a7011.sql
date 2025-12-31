-- Convertir tous les rôles "owner" existants en "admin"
UPDATE public.user_roles SET role = 'admin' WHERE role = 'owner';

-- Créer ou remplacer la fonction is_admin (remplace is_owner)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Garder is_owner comme alias pour compatibilité avec les anciennes politiques RLS
CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.is_admin(_user_id)
$$;

-- Mettre à jour has_role pour supporter la nouvelle hiérarchie
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role, _residence_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (
        _role = 'admin' -- Admin is global (was owner)
        OR residence_id = _residence_id
        OR _residence_id IS NULL
      )
  )
$$;

-- Mettre à jour has_residence_access
CREATE OR REPLACE FUNCTION public.has_residence_access(_user_id uuid, _residence_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = 'admin' OR residence_id = _residence_id)
  )
$$;

-- Mettre à jour can_manage_rental
CREATE OR REPLACE FUNCTION public.can_manage_rental(_user_id uuid, _residence_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = 'admin'
        OR (role IN ('manager') AND residence_id = _residence_id)
      )
  )
$$;

-- Table des permissions configurables pour les collaborateurs
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  residence_id UUID REFERENCES public.residences(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'cs',
  permission_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(residence_id, role, permission_key)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Policies for role_permissions
CREATE POLICY "Managers can view permissions"
ON public.role_permissions
FOR SELECT
USING (public.can_manage_rental(auth.uid(), residence_id));

CREATE POLICY "Managers can manage permissions"
ON public.role_permissions
FOR ALL
USING (public.can_manage_rental(auth.uid(), residence_id))
WITH CHECK (public.can_manage_rental(auth.uid(), residence_id));

-- Trigger for updated_at
CREATE TRIGGER update_role_permissions_updated_at
BEFORE UPDATE ON public.role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- KOPRO FULL DATABASE SCHEMA
-- Roles, Residences, Rental Module & Core Tables
-- =========================================

-- Create app roles enum including founder/owner
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'manager', 'cs', 'resident');

-- Create unit status enum
CREATE TYPE public.unit_status AS ENUM ('occupied', 'vacant');

-- Create vacancy status enum
CREATE TYPE public.vacancy_status AS ENUM ('draft', 'open', 'closed');

-- Create vacancy visibility enum
CREATE TYPE public.vacancy_visibility AS ENUM ('internal', 'public_link');

-- Create application status enum
CREATE TYPE public.application_status AS ENUM ('new', 'under_review', 'shortlist', 'accepted', 'rejected');

-- =========================================
-- CORE TABLES
-- =========================================

-- Residences table
CREATE TABLE public.residences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'France',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table (per residence, except owner which is global)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  residence_id UUID REFERENCES public.residences(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, residence_id, role)
);

-- Buildings/Entrances (optional)
CREATE TABLE public.buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lots table (with tantièmes)
CREATE TABLE public.lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
  lot_number TEXT NOT NULL,
  type TEXT, -- apartment, parking, cellar, etc.
  floor INTEGER,
  door TEXT,
  surface NUMERIC(10,2),
  rooms INTEGER,
  tantiemes INTEGER DEFAULT 0,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(residence_id, lot_number)
);

-- Occupancies (link resident to lot as owner/tenant)
CREATE TABLE public.occupancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('owner', 'tenant')),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================
-- RENTAL MODULE TABLES
-- =========================================

-- Units (Logements) for rental management
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL,
  building TEXT,
  entrance TEXT,
  floor INTEGER,
  door TEXT,
  surface NUMERIC(10,2),
  rooms INTEGER,
  type TEXT, -- T1, T2, T3, Studio, etc.
  rent_target NUMERIC(10,2),
  charges_target NUMERIC(10,2),
  status public.unit_status DEFAULT 'occupied',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Application Form Templates
CREATE TABLE public.application_form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  fields JSONB DEFAULT '[]', -- Array of field definitions
  required_docs JSONB DEFAULT '[]', -- Array of required document types
  scoring_rules JSONB DEFAULT '{}', -- Scoring configuration
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vacancies (Annonces de logement disponible)
CREATE TABLE public.vacancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.application_form_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  availability_date DATE,
  visit_slots JSONB DEFAULT '[]', -- Simple visit slots
  status public.vacancy_status DEFAULT 'draft',
  visibility public.vacancy_visibility DEFAULT 'internal',
  public_token TEXT UNIQUE, -- For public link access
  token_expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Applications (Candidatures)
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacancy_id UUID NOT NULL REFERENCES public.vacancies(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT,
  candidate_phone TEXT,
  status public.application_status DEFAULT 'new',
  notes_internal TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- null if self-submitted
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Application Fields (form data)
CREATE TABLE public.application_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  value JSONB, -- Can be string, number, array, etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(application_id, field_key)
);

-- Application Documents
CREATE TABLE public.application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL, -- pay_slip, tax_notice, id_card, etc.
  file_url TEXT NOT NULL,
  file_name TEXT,
  uploaded_by TEXT, -- 'candidate' or 'manager'
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Application Scores
CREATE TABLE public.application_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE UNIQUE,
  score_total INTEGER DEFAULT 0,
  score_breakdown JSONB DEFAULT '{}',
  computed_at TIMESTAMPTZ DEFAULT now()
);

-- Tenant Dossiers (after acceptance)
CREATE TABLE public.tenant_dossiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  tenant_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  folder_document_category TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================
-- AUDIT LOG
-- =========================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  residence_id UUID REFERENCES public.residences(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================
-- ENABLE RLS ON ALL TABLES
-- =========================================

ALTER TABLE public.residences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =========================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- =========================================

-- Check if user has a specific role (globally or for a residence)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role, _residence_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (
        _role = 'owner' -- Owner is global
        OR residence_id = _residence_id
        OR _residence_id IS NULL
      )
  )
$$;

-- Check if user is owner (founder)
CREATE OR REPLACE FUNCTION public.is_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'owner'
  )
$$;

-- Check if user has access to residence (any role)
CREATE OR REPLACE FUNCTION public.has_residence_access(_user_id UUID, _residence_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = 'owner' OR residence_id = _residence_id)
  )
$$;

-- Check if user can manage rental module (owner or manager)
CREATE OR REPLACE FUNCTION public.can_manage_rental(_user_id UUID, _residence_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = 'owner'
        OR (role IN ('manager', 'admin') AND residence_id = _residence_id)
      )
  )
$$;

-- =========================================
-- RLS POLICIES
-- =========================================

-- Profiles: Users can read all profiles, update own
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User Roles: Owners can manage all, managers can view their residence
CREATE POLICY "Owners can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_owner(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Owners can insert roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "Owners can update roles" ON public.user_roles
  FOR UPDATE TO authenticated USING (public.is_owner(auth.uid()));

CREATE POLICY "Owners can delete roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.is_owner(auth.uid()));

-- Residences: Owners can manage all, others can view their residence
CREATE POLICY "Users can view their residences" ON public.residences
  FOR SELECT TO authenticated USING (
    public.is_owner(auth.uid()) 
    OR public.has_residence_access(auth.uid(), id)
  );

CREATE POLICY "Owners can insert residences" ON public.residences
  FOR INSERT TO authenticated WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "Owners can update residences" ON public.residences
  FOR UPDATE TO authenticated USING (public.is_owner(auth.uid()));

CREATE POLICY "Owners can delete residences" ON public.residences
  FOR DELETE TO authenticated USING (public.is_owner(auth.uid()));

-- Units: Managers and owners can manage
CREATE POLICY "Units viewable by residence members" ON public.units
  FOR SELECT TO authenticated USING (
    public.is_owner(auth.uid())
    OR public.has_residence_access(auth.uid(), residence_id)
  );

CREATE POLICY "Units manageable by managers" ON public.units
  FOR ALL TO authenticated USING (
    public.can_manage_rental(auth.uid(), residence_id)
  );

-- Vacancies: Managers can manage, public token access for candidates
CREATE POLICY "Vacancies viewable by residence members and managers" ON public.vacancies
  FOR SELECT TO authenticated USING (
    public.is_owner(auth.uid())
    OR public.can_manage_rental(auth.uid(), residence_id)
  );

CREATE POLICY "Vacancies manageable by managers" ON public.vacancies
  FOR ALL TO authenticated USING (
    public.can_manage_rental(auth.uid(), residence_id)
  );

-- Allow anonymous access to public vacancies via token
CREATE POLICY "Public vacancies viewable by anyone with token" ON public.vacancies
  FOR SELECT TO anon USING (
    visibility = 'public_link' 
    AND status = 'open'
    AND (token_expires_at IS NULL OR token_expires_at > now())
  );

-- Application Form Templates
CREATE POLICY "Templates viewable by residence managers" ON public.application_form_templates
  FOR SELECT TO authenticated USING (
    public.is_owner(auth.uid())
    OR public.can_manage_rental(auth.uid(), residence_id)
  );

CREATE POLICY "Templates manageable by managers" ON public.application_form_templates
  FOR ALL TO authenticated USING (
    public.can_manage_rental(auth.uid(), residence_id)
  );

-- Applications: Managers can manage all, candidates can view/update own
CREATE POLICY "Applications viewable by managers" ON public.applications
  FOR SELECT TO authenticated USING (
    public.is_owner(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.vacancies v 
      WHERE v.id = vacancy_id 
      AND public.can_manage_rental(auth.uid(), v.residence_id)
    )
  );

CREATE POLICY "Applications manageable by managers" ON public.applications
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.vacancies v 
      WHERE v.id = vacancy_id 
      AND public.can_manage_rental(auth.uid(), v.residence_id)
    )
  );

-- Allow anonymous insert for public applications
CREATE POLICY "Anyone can submit application to public vacancy" ON public.applications
  FOR INSERT TO anon WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vacancies v 
      WHERE v.id = vacancy_id 
      AND v.visibility = 'public_link'
      AND v.status = 'open'
    )
  );

-- Application Fields
CREATE POLICY "App fields follow application access" ON public.application_fields
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.vacancies v ON v.id = a.vacancy_id
      WHERE a.id = application_id
      AND public.can_manage_rental(auth.uid(), v.residence_id)
    )
  );

CREATE POLICY "Anon can insert app fields" ON public.application_fields
  FOR INSERT TO anon WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.vacancies v ON v.id = a.vacancy_id
      WHERE a.id = application_id
      AND v.visibility = 'public_link'
    )
  );

-- Application Documents
CREATE POLICY "App docs follow application access" ON public.application_documents
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.vacancies v ON v.id = a.vacancy_id
      WHERE a.id = application_id
      AND public.can_manage_rental(auth.uid(), v.residence_id)
    )
  );

CREATE POLICY "Anon can insert app docs" ON public.application_documents
  FOR INSERT TO anon WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.vacancies v ON v.id = a.vacancy_id
      WHERE a.id = application_id
      AND v.visibility = 'public_link'
    )
  );

-- Application Scores
CREATE POLICY "Scores viewable by managers" ON public.application_scores
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.vacancies v ON v.id = a.vacancy_id
      WHERE a.id = application_id
      AND public.can_manage_rental(auth.uid(), v.residence_id)
    )
  );

CREATE POLICY "Scores manageable by managers" ON public.application_scores
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.vacancies v ON v.id = a.vacancy_id
      WHERE a.id = application_id
      AND public.can_manage_rental(auth.uid(), v.residence_id)
    )
  );

-- Tenant Dossiers
CREATE POLICY "Dossiers viewable by managers" ON public.tenant_dossiers
  FOR SELECT TO authenticated USING (
    public.is_owner(auth.uid())
    OR public.can_manage_rental(auth.uid(), residence_id)
  );

CREATE POLICY "Dossiers manageable by managers" ON public.tenant_dossiers
  FOR ALL TO authenticated USING (
    public.can_manage_rental(auth.uid(), residence_id)
  );

-- Audit Logs: Owners can view all, managers can view their residence
CREATE POLICY "Owners can view all audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (
    public.is_owner(auth.uid())
    OR (residence_id IS NOT NULL AND public.has_residence_access(auth.uid(), residence_id))
  );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Buildings & Lots policies
CREATE POLICY "Buildings viewable by residence members" ON public.buildings
  FOR SELECT TO authenticated USING (
    public.is_owner(auth.uid())
    OR public.has_residence_access(auth.uid(), residence_id)
  );

CREATE POLICY "Buildings manageable by managers" ON public.buildings
  FOR ALL TO authenticated USING (
    public.can_manage_rental(auth.uid(), residence_id)
  );

CREATE POLICY "Lots viewable by residence members" ON public.lots
  FOR SELECT TO authenticated USING (
    public.is_owner(auth.uid())
    OR public.has_residence_access(auth.uid(), residence_id)
  );

CREATE POLICY "Lots manageable by managers" ON public.lots
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND (role = 'owner' OR (role IN ('manager', 'admin') AND user_roles.residence_id = lots.residence_id))
    )
  );

CREATE POLICY "Occupancies viewable by residence members" ON public.occupancies
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.lots l
      WHERE l.id = lot_id
      AND public.has_residence_access(auth.uid(), l.residence_id)
    )
  );

CREATE POLICY "Occupancies manageable by managers" ON public.occupancies
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.lots l
      JOIN public.user_roles ur ON ur.user_id = auth.uid()
      WHERE l.id = lot_id
      AND (ur.role = 'owner' OR (ur.role IN ('manager', 'admin') AND ur.residence_id = l.residence_id))
    )
  );

-- =========================================
-- TRIGGERS
-- =========================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_residences_updated_at BEFORE UPDATE ON public.residences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lots_updated_at BEFORE UPDATE ON public.lots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vacancies_updated_at BEFORE UPDATE ON public.vacancies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_dossiers_updated_at BEFORE UPDATE ON public.tenant_dossiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.application_form_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generate public token for vacancy
CREATE OR REPLACE FUNCTION public.generate_vacancy_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.visibility = 'public_link' AND NEW.public_token IS NULL THEN
    NEW.public_token = encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_vacancy_token_trigger
  BEFORE INSERT OR UPDATE ON public.vacancies
  FOR EACH ROW EXECUTE FUNCTION public.generate_vacancy_token();

-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_residence_id ON public.user_roles(residence_id);
CREATE INDEX idx_lots_residence_id ON public.lots(residence_id);
CREATE INDEX idx_units_residence_id ON public.units(residence_id);
CREATE INDEX idx_units_status ON public.units(status);
CREATE INDEX idx_vacancies_residence_id ON public.vacancies(residence_id);
CREATE INDEX idx_vacancies_status ON public.vacancies(status);
CREATE INDEX idx_vacancies_public_token ON public.vacancies(public_token);
CREATE INDEX idx_applications_vacancy_id ON public.applications(vacancy_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_residence_id ON public.audit_logs(residence_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

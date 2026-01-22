
-- PHASE 1: NOUVELLE ARCHITECTURE BAILLEUR/SYNDIC

-- 1. Ajouter le nouveau type de rôle (bailleur remplace manager conceptuellement)
-- Garder 'manager' dans l'enum pour compatibilité mais ajouter 'bailleur' et 'syndic' comme alias logiques
-- Le rôle 'manager' devient équivalent à bailleur OU syndic selon agency.type

-- 2. Table des appartements gérés par les Bailleurs
CREATE TABLE public.landlord_apartments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  residence_id UUID REFERENCES public.residences(id) ON DELETE SET NULL,
  building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
  door TEXT NOT NULL,
  floor INTEGER,
  type TEXT CHECK (type IN ('T1', 'T2', 'T3', 'T4', 'T5', 'studio', 'maison', 'local', 'parking', 'cave')),
  surface NUMERIC,
  rooms INTEGER,
  rent_target NUMERIC,
  charges_target NUMERIC,
  status TEXT DEFAULT 'vacant' CHECK (status IN ('vacant', 'occupied', 'maintenance')),
  join_code TEXT UNIQUE,
  is_approved_by_syndic BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger pour générer le join_code automatiquement
CREATE OR REPLACE FUNCTION public.generate_landlord_apartment_join_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.join_code IS NULL THEN
    NEW.join_code = upper(substring(md5(random()::text) from 1 for 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_landlord_apartment_join_code_trigger
BEFORE INSERT ON public.landlord_apartments
FOR EACH ROW EXECUTE FUNCTION public.generate_landlord_apartment_join_code();

-- Trigger updated_at
CREATE TRIGGER update_landlord_apartments_updated_at
BEFORE UPDATE ON public.landlord_apartments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Table des demandes de rattachement appartement → résidence
CREATE TABLE public.apartment_attachment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES public.landlord_apartments(id) ON DELETE CASCADE,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  syndic_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT
);

-- 4. Table des baux locataires (gérés par Bailleur)
CREATE TABLE public.tenant_leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES public.landlord_apartments(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  rent NUMERIC NOT NULL,
  charges NUMERIC DEFAULT 0,
  deposit NUMERIC DEFAULT 0,
  payment_day INTEGER DEFAULT 1 CHECK (payment_day BETWEEN 1 AND 28),
  lease_type TEXT DEFAULT 'habitation' CHECK (lease_type IN ('habitation', 'meuble', 'commercial', 'professionnel')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'ended', 'terminated')),
  contract_file_url TEXT,
  signature_date DATE,
  notice_given_at DATE,
  termination_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_tenant_leases_updated_at
BEFORE UPDATE ON public.tenant_leases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Catégories de tickets avec scope privé/commun
CREATE TABLE public.ticket_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('private', 'common', 'both')),
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insertion des catégories par défaut
INSERT INTO public.ticket_categories (name, name_fr, scope, icon, display_order) VALUES
-- Catégories privées (Bailleur)
('plumbing_private', 'Plomberie appartement', 'private', 'droplet', 1),
('electricity_private', 'Électricité appartement', 'private', 'zap', 2),
('heating_private', 'Chauffage individuel', 'private', 'flame', 3),
('appliances', 'Équipements cuisine/salle de bain', 'private', 'refrigerator', 4),
('windows_doors', 'Fenêtres et portes', 'private', 'door-open', 5),
('flooring', 'Revêtements sols', 'private', 'square', 6),
-- Catégories communes (Syndic)
('elevator', 'Ascenseur', 'common', 'arrow-up-down', 10),
('hall', 'Hall d''entrée', 'common', 'door-closed', 11),
('roof', 'Toiture', 'common', 'home', 12),
('garden', 'Espaces verts', 'common', 'tree-deciduous', 13),
('parking', 'Parking', 'common', 'car', 14),
('common_lighting', 'Éclairage commun', 'common', 'lightbulb', 15),
('common_plumbing', 'Plomberie parties communes', 'common', 'droplet', 16),
('common_electricity', 'Électricité parties communes', 'common', 'zap', 17),
('intercom', 'Interphone/Digicode', 'common', 'phone', 18),
('garbage', 'Local poubelles', 'common', 'trash-2', 19),
-- Catégories mixtes
('noise', 'Nuisances sonores', 'both', 'volume-2', 20),
('security', 'Sécurité', 'both', 'shield', 21),
('other', 'Autre', 'both', 'help-circle', 99);

-- 6. Modifications table tickets pour scope et routage
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'common' CHECK (scope IN ('private', 'common')),
ADD COLUMN IF NOT EXISTS landlord_apartment_id UUID REFERENCES public.landlord_apartments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_to_role TEXT CHECK (assigned_to_role IN ('bailleur', 'syndic')),
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.ticket_categories(id);

-- 7. Modifications table residences pour gestion syndic
ALTER TABLE public.residences
ADD COLUMN IF NOT EXISTS created_by_syndic_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS allow_landlord_join BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS requires_syndic_approval BOOLEAN DEFAULT true;

-- 8. Modification user_roles pour supporter apartment_id
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS apartment_id UUID REFERENCES public.landlord_apartments(id) ON DELETE CASCADE;

-- 9. RLS Policies pour landlord_apartments
ALTER TABLE public.landlord_apartments ENABLE ROW LEVEL SECURITY;

-- Admin voit tout
CREATE POLICY "Admin full access landlord_apartments"
ON public.landlord_apartments FOR ALL
USING (public.is_admin(auth.uid()));

-- Bailleur voit ses propres appartements
CREATE POLICY "Landlord read own apartments"
ON public.landlord_apartments FOR SELECT
USING (landlord_id = auth.uid());

CREATE POLICY "Landlord insert own apartments"
ON public.landlord_apartments FOR INSERT
WITH CHECK (landlord_id = auth.uid());

CREATE POLICY "Landlord update own apartments"
ON public.landlord_apartments FOR UPDATE
USING (landlord_id = auth.uid());

CREATE POLICY "Landlord delete own apartments"
ON public.landlord_apartments FOR DELETE
USING (landlord_id = auth.uid());

-- Syndic voit appartements approuvés de ses résidences
CREATE POLICY "Syndic read approved apartments in residence"
ON public.landlord_apartments FOR SELECT
USING (
  is_approved_by_syndic = true
  AND residence_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.residences r ON r.id = landlord_apartments.residence_id
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'manager'
    AND (ur.residence_id = landlord_apartments.residence_id OR ur.agency_id = r.agency_id)
  )
);

-- 10. RLS Policies pour apartment_attachment_requests
ALTER TABLE public.apartment_attachment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access attachment_requests"
ON public.apartment_attachment_requests FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Landlord read own requests"
ON public.apartment_attachment_requests FOR SELECT
USING (landlord_id = auth.uid());

CREATE POLICY "Landlord create requests"
ON public.apartment_attachment_requests FOR INSERT
WITH CHECK (landlord_id = auth.uid());

CREATE POLICY "Syndic read requests for their residences"
ON public.apartment_attachment_requests FOR SELECT
USING (syndic_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  AND ur.role = 'manager'
  AND ur.residence_id = apartment_attachment_requests.residence_id
));

CREATE POLICY "Syndic update requests for their residences"
ON public.apartment_attachment_requests FOR UPDATE
USING (syndic_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  AND ur.role = 'manager'
  AND ur.residence_id = apartment_attachment_requests.residence_id
));

-- 11. RLS Policies pour tenant_leases
ALTER TABLE public.tenant_leases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access tenant_leases"
ON public.tenant_leases FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Landlord manage own leases"
ON public.tenant_leases FOR ALL
USING (landlord_id = auth.uid());

CREATE POLICY "Tenant read own lease"
ON public.tenant_leases FOR SELECT
USING (tenant_id = auth.uid());

-- 12. RLS pour ticket_categories (lecture publique)
ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active categories"
ON public.ticket_categories FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin manage categories"
ON public.ticket_categories FOR ALL
USING (public.is_admin(auth.uid()));

-- 13. Index pour performances
CREATE INDEX IF NOT EXISTS idx_landlord_apartments_landlord ON public.landlord_apartments(landlord_id);
CREATE INDEX IF NOT EXISTS idx_landlord_apartments_residence ON public.landlord_apartments(residence_id);
CREATE INDEX IF NOT EXISTS idx_landlord_apartments_status ON public.landlord_apartments(status);
CREATE INDEX IF NOT EXISTS idx_tenant_leases_apartment ON public.tenant_leases(apartment_id);
CREATE INDEX IF NOT EXISTS idx_tenant_leases_tenant ON public.tenant_leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_leases_landlord ON public.tenant_leases(landlord_id);
CREATE INDEX IF NOT EXISTS idx_tenant_leases_status ON public.tenant_leases(status);
CREATE INDEX IF NOT EXISTS idx_tickets_scope ON public.tickets(scope);
CREATE INDEX IF NOT EXISTS idx_tickets_landlord_apartment ON public.tickets(landlord_apartment_id);
CREATE INDEX IF NOT EXISTS idx_apartment_attachment_requests_status ON public.apartment_attachment_requests(status);

-- =====================================================
-- PHASE 1: TABLES FONDAMENTALES POUR L'AUDIT COMPLET
-- =====================================================

-- 1. COMPTABILITÉ AVANCÉE
-- Table des comptes comptables (plan comptable)
CREATE TABLE public.accounting_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_id UUID REFERENCES public.accounting_accounts(id),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Journal comptable
CREATE TABLE public.accounting_journals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('general', 'bank', 'sales', 'purchases', 'operations')),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Écritures comptables détaillées
CREATE TABLE public.accounting_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES public.accounting_entries(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounting_accounts(id),
  journal_id UUID REFERENCES public.accounting_journals(id),
  debit DECIMAL(12,2) DEFAULT 0,
  credit DECIMAL(12,2) DEFAULT 0,
  label VARCHAR(255),
  reference VARCHAR(100),
  date DATE NOT NULL,
  residence_id UUID REFERENCES public.residences(id),
  lot_id UUID REFERENCES public.lots(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. GESTION LOCATIVE AVANCÉE
-- Baux / Contrats de location
CREATE TABLE public.leases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.profiles(id),
  residence_id UUID NOT NULL REFERENCES public.residences(id),
  lease_type VARCHAR(50) NOT NULL DEFAULT 'unfurnished' CHECK (lease_type IN ('unfurnished', 'furnished', 'commercial', 'parking')),
  start_date DATE NOT NULL,
  end_date DATE,
  initial_rent DECIMAL(10,2) NOT NULL,
  current_rent DECIMAL(10,2) NOT NULL,
  charges_amount DECIMAL(10,2) DEFAULT 0,
  charges_type VARCHAR(50) DEFAULT 'provision' CHECK (charges_type IN ('provision', 'forfait', 'real')),
  deposit_amount DECIMAL(10,2),
  payment_day INTEGER DEFAULT 1 CHECK (payment_day BETWEEN 1 AND 28),
  irl_revision_date DATE,
  last_revision_date DATE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'terminated', 'renewed')),
  signed_at TIMESTAMPTZ,
  signature_url TEXT,
  notice_given_at DATE,
  notice_period_months INTEGER DEFAULT 3,
  guarantor_name VARCHAR(255),
  guarantor_phone VARCHAR(50),
  guarantor_email VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Historique des révisions de loyer
CREATE TABLE public.rent_revisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id UUID NOT NULL REFERENCES public.leases(id) ON DELETE CASCADE,
  previous_rent DECIMAL(10,2) NOT NULL,
  new_rent DECIMAL(10,2) NOT NULL,
  irl_index DECIMAL(6,2),
  revision_date DATE NOT NULL,
  applied_at DATE,
  notification_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Régularisation des charges
CREATE TABLE public.charges_regularizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id UUID NOT NULL REFERENCES public.leases(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  provisions_total DECIMAL(10,2) NOT NULL,
  actual_charges DECIMAL(10,2) NOT NULL,
  balance DECIMAL(10,2) NOT NULL, -- Positive = tenant owes, negative = refund
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'disputed')),
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- États des lieux
CREATE TABLE public.property_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  lease_id UUID REFERENCES public.leases(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('entry', 'exit')),
  inspection_date DATE NOT NULL,
  conducted_by UUID REFERENCES public.profiles(id),
  tenant_present BOOLEAN DEFAULT true,
  general_condition VARCHAR(50) CHECK (general_condition IN ('excellent', 'good', 'fair', 'poor')),
  rooms JSONB DEFAULT '[]', -- Array of {name, condition, notes, photos[]}
  keys_count INTEGER,
  meters_reading JSONB, -- {electricity, gas, water}
  observations TEXT,
  photos JSONB DEFAULT '[]',
  tenant_signature_url TEXT,
  manager_signature_url TEXT,
  signed_at TIMESTAMPTZ,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. COPROPRIÉTÉ / SYNDIC
-- Budgets prévisionnels
CREATE TABLE public.copro_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'voted', 'closed')),
  total_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
  voted_at DATE,
  assembly_id UUID REFERENCES public.general_assemblies(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(residence_id, fiscal_year)
);

-- Lignes de budget par catégorie
CREATE TABLE public.copro_budget_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES public.copro_budgets(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL, -- 'entretien', 'ascenseur', 'chauffage', etc.
  label VARCHAR(255) NOT NULL,
  budgeted_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  actual_amount DECIMAL(10,2) DEFAULT 0,
  distribution_key VARCHAR(50) DEFAULT 'general', -- 'general', 'ascenseur', 'chauffage'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Clés de répartition
CREATE TABLE public.distribution_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(residence_id, code)
);

-- Tantièmes par lot et clé de répartition
CREATE TABLE public.lot_distribution_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  key_id UUID NOT NULL REFERENCES public.distribution_keys(id) ON DELETE CASCADE,
  shares INTEGER NOT NULL DEFAULT 0,
  UNIQUE(lot_id, key_id)
);

-- Appels de fonds
CREATE TABLE public.copro_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES public.copro_budgets(id),
  call_number VARCHAR(50) NOT NULL,
  label VARCHAR(255) NOT NULL,
  call_type VARCHAR(50) DEFAULT 'provision' CHECK (call_type IN ('provision', 'works', 'exceptional')),
  quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),
  due_date DATE NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partial', 'paid')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Détail des appels de fonds par lot
CREATE TABLE public.copro_call_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID NOT NULL REFERENCES public.copro_calls(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  paid_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fonds travaux (loi ALUR)
CREATE TABLE public.copro_works_fund (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) DEFAULT 0,
  minimum_percentage DECIMAL(5,2) DEFAULT 5.00, -- 5% du budget prévisionnel
  last_contribution_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(residence_id)
);

-- 4. ORDRES DE SERVICE / MAINTENANCE
CREATE TABLE public.work_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES public.tickets(id),
  lot_id UUID REFERENCES public.lots(id),
  building_id UUID REFERENCES public.buildings(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  provider_id UUID REFERENCES public.service_providers(id),
  assigned_to UUID REFERENCES public.profiles(id),
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  scheduled_date DATE,
  completed_date DATE,
  completion_notes TEXT,
  photos_before JSONB DEFAULT '[]',
  photos_after JSONB DEFAULT '[]',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Devis fournisseurs
CREATE TABLE public.supplier_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE,
  residence_id UUID NOT NULL REFERENCES public.residences(id),
  provider_id UUID NOT NULL REFERENCES public.service_providers(id),
  quote_number VARCHAR(100),
  description TEXT,
  amount_ht DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 20.00,
  amount_ttc DECIMAL(10,2) NOT NULL,
  validity_date DATE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  file_url TEXT,
  selected_at TIMESTAMPTZ,
  selected_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Carnet d'entretien
CREATE TABLE public.maintenance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id),
  equipment_type VARCHAR(100) NOT NULL, -- 'ascenseur', 'chaudiere', 'toiture', etc.
  equipment_name VARCHAR(255),
  last_maintenance DATE,
  next_maintenance DATE,
  contract_provider_id UUID REFERENCES public.service_providers(id),
  contract_start DATE,
  contract_end DATE,
  contract_amount DECIMAL(10,2),
  notes TEXT,
  documents JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. DIAGNOSTICS IMMOBILIERS
CREATE TABLE public.property_diagnostics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID REFERENCES public.lots(id) ON DELETE CASCADE,
  residence_id UUID REFERENCES public.residences(id),
  diagnostic_type VARCHAR(50) NOT NULL, -- 'dpe', 'electricite', 'gaz', 'amiante', 'plomb', 'termites', 'erp'
  performed_date DATE NOT NULL,
  expiry_date DATE,
  result VARCHAR(50), -- For DPE: A, B, C, D, E, F, G
  energy_class VARCHAR(5),
  ges_class VARCHAR(5),
  file_url TEXT,
  provider_name VARCHAR(255),
  is_valid BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. SYNCHRONISATION BANCAIRE
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  residence_id UUID REFERENCES public.residences(id),
  bank_name VARCHAR(100) NOT NULL,
  account_name VARCHAR(255),
  iban VARCHAR(34),
  bic VARCHAR(11),
  account_type VARCHAR(50) DEFAULT 'current' CHECK (account_type IN ('current', 'savings', 'deposit')),
  balance DECIMAL(12,2) DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  is_main BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  external_id VARCHAR(255), -- ID from bank
  transaction_date DATE NOT NULL,
  value_date DATE,
  amount DECIMAL(12,2) NOT NULL,
  label VARCHAR(500),
  category VARCHAR(100),
  counterparty VARCHAR(255),
  is_reconciled BOOLEAN DEFAULT false,
  reconciled_with UUID, -- Link to payment or accounting entry
  reconciled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. AMÉLIORATIONS EXISTANTES
-- Ajouter colonnes manquantes à lots
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS cadastral_reference VARCHAR(50);
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS acquisition_date DATE;
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS acquisition_price DECIMAL(12,2);

-- Ajouter colonnes pour gestion locative avancée aux units
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2);
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS available_from DATE;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS minimum_lease_months INTEGER DEFAULT 12;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS pets_allowed BOOLEAN DEFAULT false;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS smoking_allowed BOOLEAN DEFAULT false;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS energy_class VARCHAR(5);
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS ges_class VARCHAR(5);

-- 8. ENABLE RLS ON ALL NEW TABLES
ALTER TABLE public.accounting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charges_regularizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copro_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copro_budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lot_distribution_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copro_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copro_call_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copro_works_fund ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

-- 9. RLS POLICIES FOR ALL TABLES
-- Admins have full access
CREATE POLICY "Admins have full access to accounting_accounts" ON public.accounting_accounts FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins have full access to accounting_journals" ON public.accounting_journals FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins have full access to accounting_lines" ON public.accounting_lines FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins have full access to leases" ON public.leases FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins have full access to rent_revisions" ON public.rent_revisions FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins have full access to charges_regularizations" ON public.charges_regularizations FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins have full access to property_inspections" ON public.property_inspections FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins have full access to copro_budgets" ON public.copro_budgets FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins have full access to copro_budget_lines" ON public.copro_budget_lines FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins have full access to distribution_keys" ON public.distribution_keys FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins have full access to lot_distribution_shares" ON public.lot_distribution_shares FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins have full access to copro_calls" ON public.copro_calls FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins have full access to copro_call_items" ON public.copro_call_items FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins have full access to copro_works_fund" ON public.copro_works_fund FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins have full access to work_orders" ON public.work_orders FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins have full access to supplier_quotes" ON public.supplier_quotes FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins have full access to maintenance_logs" ON public.maintenance_logs FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins have full access to property_diagnostics" ON public.property_diagnostics FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins have full access to bank_accounts" ON public.bank_accounts FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins have full access to bank_transactions" ON public.bank_transactions FOR ALL USING (public.is_admin(auth.uid()));

-- Managers can access their residences
CREATE POLICY "Managers can access leases in their residences" ON public.leases FOR ALL USING (public.has_residence_access(auth.uid(), residence_id));
CREATE POLICY "Managers can access property_inspections in their residences" ON public.property_inspections FOR ALL USING (public.has_residence_access(auth.uid(), (SELECT residence_id FROM public.lots WHERE id = lot_id)));
CREATE POLICY "Managers can access copro_budgets in their residences" ON public.copro_budgets FOR ALL USING (public.has_residence_access(auth.uid(), residence_id));
CREATE POLICY "Managers can access copro_calls in their residences" ON public.copro_calls FOR ALL USING (public.has_residence_access(auth.uid(), residence_id));
CREATE POLICY "Managers can access work_orders in their residences" ON public.work_orders FOR ALL USING (public.has_residence_access(auth.uid(), residence_id));
CREATE POLICY "Managers can access supplier_quotes in their residences" ON public.supplier_quotes FOR ALL USING (public.has_residence_access(auth.uid(), residence_id));
CREATE POLICY "Managers can access maintenance_logs in their residences" ON public.maintenance_logs FOR ALL USING (public.has_residence_access(auth.uid(), residence_id));
CREATE POLICY "Managers can access property_diagnostics" ON public.property_diagnostics FOR ALL USING (
  public.has_residence_access(auth.uid(), residence_id) 
  OR public.has_residence_access(auth.uid(), (SELECT residence_id FROM public.lots WHERE id = lot_id))
);
CREATE POLICY "Managers can access distribution_keys in their residences" ON public.distribution_keys FOR ALL USING (public.has_residence_access(auth.uid(), residence_id));
CREATE POLICY "Managers can access copro_works_fund in their residences" ON public.copro_works_fund FOR ALL USING (public.has_residence_access(auth.uid(), residence_id));

-- Tenants can view their own leases
CREATE POLICY "Tenants can view their own leases" ON public.leases FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "Tenants can view their own rent_revisions" ON public.rent_revisions FOR SELECT USING (
  lease_id IN (SELECT id FROM public.leases WHERE tenant_id = auth.uid())
);
CREATE POLICY "Tenants can view their own charges_regularizations" ON public.charges_regularizations FOR SELECT USING (
  lease_id IN (SELECT id FROM public.leases WHERE tenant_id = auth.uid())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leases_tenant_id ON public.leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_lot_id ON public.leases(lot_id);
CREATE INDEX IF NOT EXISTS idx_leases_residence_id ON public.leases(residence_id);
CREATE INDEX IF NOT EXISTS idx_leases_status ON public.leases(status);
CREATE INDEX IF NOT EXISTS idx_copro_calls_residence_id ON public.copro_calls(residence_id);
CREATE INDEX IF NOT EXISTS idx_copro_call_items_lot_id ON public.copro_call_items(lot_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_residence_id ON public.work_orders(residence_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(status);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account_id ON public.bank_transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON public.bank_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_property_diagnostics_lot_id ON public.property_diagnostics(lot_id);
CREATE INDEX IF NOT EXISTS idx_property_diagnostics_expiry ON public.property_diagnostics(expiry_date);
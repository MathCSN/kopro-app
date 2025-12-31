-- =========================================================
-- PHASE 1: Global Collaborator Permissions (Agency-wide)
-- =========================================================

-- Make residence_id nullable for global agency permissions
ALTER TABLE public.role_permissions 
ALTER COLUMN residence_id DROP NOT NULL;

-- Add comment explaining the logic
COMMENT ON COLUMN public.role_permissions.residence_id IS 'NULL means global agency-level permission, applies to all residences';

-- Create function to check CS (collaborator) permissions globally
CREATE OR REPLACE FUNCTION public.has_cs_permission(_user_id uuid, _permission_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    WHERE rp.role = 'cs'
      AND rp.permission_key = _permission_key
      AND rp.enabled = true
      AND rp.residence_id IS NULL  -- Global agency permissions only
  )
  AND EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = 'cs'
  )
$$;

-- =========================================================
-- PHASE 2: Pricing Configuration (Admin only)
-- =========================================================

CREATE TABLE public.pricing_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activation_price_per_residence numeric NOT NULL DEFAULT 299,
  monthly_price_per_apartment numeric NOT NULL DEFAULT 2.5,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

-- Enable RLS
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage pricing
CREATE POLICY "Admins can manage pricing config"
ON public.pricing_config
FOR ALL
USING (is_admin(auth.uid()));

-- Insert default pricing
INSERT INTO public.pricing_config (activation_price_per_residence, monthly_price_per_apartment)
VALUES (299, 2.5);

-- =========================================================
-- PHASE 3: Quotes with Traceable Discounts
-- =========================================================

-- Add catalog price and discount columns to quotes
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS catalog_activation_price numeric,
ADD COLUMN IF NOT EXISTS catalog_monthly_price numeric,
ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_activation_price numeric,
ADD COLUMN IF NOT EXISTS final_monthly_price numeric;

-- =========================================================
-- PHASE 4-5: Agency Subscriptions & Self-Service
-- =========================================================

-- Create agency subscriptions table
CREATE TABLE public.agency_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  residences_count integer NOT NULL DEFAULT 1,
  apartments_count integer NOT NULL DEFAULT 10,
  catalog_activation_price numeric NOT NULL,
  catalog_monthly_price numeric NOT NULL,
  activation_price_paid numeric NOT NULL,
  monthly_price numeric NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
  paid_at timestamp with time zone,
  stripe_subscription_id text,
  stripe_customer_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agency_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.agency_subscriptions
FOR SELECT
USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage subscriptions"
ON public.agency_subscriptions
FOR ALL
USING (is_admin(auth.uid()));

-- Users can insert their own subscriptions
CREATE POLICY "Users can create their own subscriptions"
ON public.agency_subscriptions
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own pending subscriptions
CREATE POLICY "Users can update their pending subscriptions"
ON public.agency_subscriptions
FOR UPDATE
USING (user_id = auth.uid() AND status = 'pending');

-- =========================================================
-- PHASE 6: CRM System
-- =========================================================

-- CRM Contact statuses
CREATE TABLE public.crm_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  name text,
  company text,
  phone text,
  status text DEFAULT 'lead' CHECK (status IN ('lead', 'simulation', 'quoted', 'pending_payment', 'active', 'churned')),
  source text CHECK (source IN ('website', 'referral', 'admin_created', 'quote', 'self_signup')),
  notes text,
  quote_id uuid REFERENCES public.quotes(id),
  subscription_id uuid,
  user_id uuid,
  last_contact_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

-- Only admins can manage CRM
CREATE POLICY "Admins can manage CRM contacts"
ON public.crm_contacts
FOR ALL
USING (is_admin(auth.uid()));

-- CRM Activities log
CREATE TABLE public.crm_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('simulation', 'quote_created', 'quote_sent', 'quote_viewed', 'payment_started', 'payment_completed', 'account_activated', 'note_added', 'status_changed', 'email_sent', 'call')),
  description text,
  metadata jsonb DEFAULT '{}',
  created_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

-- Only admins can manage activities
CREATE POLICY "Admins can manage CRM activities"
ON public.crm_activities
FOR ALL
USING (is_admin(auth.uid()));

-- =========================================================
-- PHASE 7: Internal Accounting
-- =========================================================

CREATE TABLE public.accounting_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id uuid REFERENCES public.quotes(id),
  subscription_id uuid REFERENCES public.agency_subscriptions(id),
  contact_id uuid REFERENCES public.crm_contacts(id),
  type text NOT NULL CHECK (type IN ('activation', 'monthly', 'refund', 'adjustment')),
  description text,
  catalog_amount numeric NOT NULL,
  discount_percent numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  final_amount numeric NOT NULL,
  vat_rate numeric DEFAULT 20,
  vat_amount numeric,
  total_ttc numeric,
  paid_at timestamp with time zone,
  payment_method text,
  stripe_payment_id text,
  invoice_number text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;

-- Only admins can manage accounting
CREATE POLICY "Admins can manage accounting entries"
ON public.accounting_entries
FOR ALL
USING (is_admin(auth.uid()));

-- Add foreign key for subscription_id in crm_contacts
ALTER TABLE public.crm_contacts
ADD CONSTRAINT crm_contacts_subscription_id_fkey
FOREIGN KEY (subscription_id) REFERENCES public.agency_subscriptions(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON public.crm_contacts(status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON public.crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact_id ON public.crm_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_type ON public.accounting_entries(type);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_paid_at ON public.accounting_entries(paid_at);
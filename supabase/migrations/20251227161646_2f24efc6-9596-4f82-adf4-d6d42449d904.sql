-- Create email_templates table for storing customizable email templates
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID REFERENCES public.residences(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom', -- 'document_reminder', 'rent_receipt', 'rent_revision', 'custom'
  variables JSONB DEFAULT '[]'::jsonb, -- Available variables like {tenant_name}, {document_type}, etc.
  logo_url TEXT,
  footer_text TEXT DEFAULT 'KOPRO - Gestion de copropriété simplifiée',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tenant_documents table for storing tenant documents
CREATE TABLE public.tenant_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  occupancy_id UUID REFERENCES public.occupancies(id) ON DELETE CASCADE,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- The tenant
  doc_type TEXT NOT NULL, -- 'assurance_habitation', 'piece_identite', 'justificatif_domicile', 'quittance', etc.
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  expires_at DATE, -- For documents that expire like insurance
  verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create document_requests table for tracking document reminder requests
CREATE TABLE public.document_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  tenant_user_id UUID NOT NULL,
  doc_type TEXT NOT NULL,
  requested_by UUID NOT NULL,
  email_template_id UUID REFERENCES public.email_templates(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'received', 'expired'
  sent_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create rent_receipts table for tracking sent rent receipts
CREATE TABLE public.rent_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES public.lots(id),
  tenant_user_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  rent_amount NUMERIC NOT NULL,
  charges_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  payment_received BOOLEAN DEFAULT false,
  payment_date DATE,
  sent_at TIMESTAMP WITH TIME ZONE,
  sent_by UUID,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates
CREATE POLICY "Managers can manage email templates"
ON public.email_templates FOR ALL
USING (can_manage_rental(auth.uid(), residence_id));

CREATE POLICY "View global templates"
ON public.email_templates FOR SELECT
USING (residence_id IS NULL);

-- RLS Policies for tenant_documents
CREATE POLICY "Managers can manage tenant documents"
ON public.tenant_documents FOR ALL
USING (can_manage_rental(auth.uid(), residence_id));

CREATE POLICY "Tenants can view their own documents"
ON public.tenant_documents FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Tenants can upload their own documents"
ON public.tenant_documents FOR INSERT
WITH CHECK (user_id = auth.uid());

-- RLS Policies for document_requests
CREATE POLICY "Managers can manage document requests"
ON public.document_requests FOR ALL
USING (can_manage_rental(auth.uid(), residence_id));

CREATE POLICY "Tenants can view their document requests"
ON public.document_requests FOR SELECT
USING (tenant_user_id = auth.uid());

-- RLS Policies for rent_receipts
CREATE POLICY "Managers can manage rent receipts"
ON public.rent_receipts FOR ALL
USING (can_manage_rental(auth.uid(), residence_id));

CREATE POLICY "Tenants can view their rent receipts"
ON public.rent_receipts FOR SELECT
USING (tenant_user_id = auth.uid());

-- Create storage bucket for tenant documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('tenant-documents', 'tenant-documents', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Managers can manage tenant document files"
ON storage.objects FOR ALL
USING (
  bucket_id = 'tenant-documents' AND
  EXISTS (
    SELECT 1 FROM public.tenant_documents td
    WHERE td.file_url LIKE '%' || storage.objects.name
    AND can_manage_rental(auth.uid(), td.residence_id)
  )
);

CREATE POLICY "Tenants can view their document files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tenant-documents' AND
  EXISTS (
    SELECT 1 FROM public.tenant_documents td
    WHERE td.file_url LIKE '%' || storage.objects.name
    AND td.user_id = auth.uid()
  )
);

CREATE POLICY "Tenants can upload their document files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tenant-documents' AND
  auth.uid() IS NOT NULL
);

-- Insert default email templates
INSERT INTO public.email_templates (residence_id, name, subject, body, type, variables) VALUES
(NULL, 'Demande de document', 'Demande de document : {document_type}', 
'Bonjour {tenant_name},

Nous vous prions de bien vouloir nous transmettre le document suivant : {document_type}.

Merci de nous l''envoyer dans les meilleurs délais.

Cordialement,
{manager_name}

---
KOPRO - Gestion de copropriété simplifiée', 
'document_reminder', '["tenant_name", "document_type", "manager_name", "residence_name"]'),

(NULL, 'Quittance de loyer', 'Quittance de loyer - {period}',
'Bonjour {tenant_name},

Veuillez trouver ci-joint votre quittance de loyer pour la période du {period_start} au {period_end}.

Montant du loyer : {rent_amount} €
Charges : {charges_amount} €
Total : {total_amount} €

Informations bancaires pour le règlement :
{bank_info}

Cordialement,
{manager_name}

---
KOPRO - Gestion de copropriété simplifiée',
'rent_receipt', '["tenant_name", "period", "period_start", "period_end", "rent_amount", "charges_amount", "total_amount", "bank_info", "manager_name"]'),

(NULL, 'Révision de loyer', 'Notification de révision de loyer',
'Bonjour {tenant_name},

Nous vous informons que votre loyer sera révisé à compter du {effective_date}.

Ancien loyer : {old_rent} €
Nouveau loyer : {new_rent} €
Charges : {charges_amount} €
Nouveau total : {new_total} €

Cette révision représente une augmentation de {percentage}%.

Cordialement,
{manager_name}

---
KOPRO - Gestion de copropriété simplifiée',
'rent_revision', '["tenant_name", "effective_date", "old_rent", "new_rent", "charges_amount", "new_total", "percentage", "manager_name"]');

-- Add trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_documents_updated_at
BEFORE UPDATE ON public.tenant_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
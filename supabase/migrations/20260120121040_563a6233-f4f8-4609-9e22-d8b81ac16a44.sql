-- Phase 1: Modifications de la base de données pour la séparation Bailleur/Syndic

-- 1.1 Ajouter account_type à la table trial_accounts
ALTER TABLE public.trial_accounts 
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'bailleur' 
CHECK (account_type IN ('bailleur', 'syndic'));

-- 1.2 Ajouter bailleur_agency_id à la table lots
-- Cette colonne permet de lier un appartement à une agence bailleur distincte 
-- de l'agence syndic qui gère la résidence
ALTER TABLE public.lots 
ADD COLUMN IF NOT EXISTS bailleur_agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL;

-- Index pour améliorer les performances des requêtes par bailleur
CREATE INDEX IF NOT EXISTS idx_lots_bailleur_agency_id ON public.lots(bailleur_agency_id);

-- 1.3 Créer une table de partage d'informations lot_syndic_sharing
CREATE TABLE IF NOT EXISTS public.lot_syndic_sharing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  bailleur_agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  syndic_agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  share_tenant_info BOOLEAN DEFAULT false,
  share_lease_info BOOLEAN DEFAULT false,
  share_contact_info BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lot_id, bailleur_agency_id, syndic_agency_id)
);

-- Enable RLS on lot_syndic_sharing
ALTER TABLE public.lot_syndic_sharing ENABLE ROW LEVEL SECURITY;

-- Policy: Les admins peuvent tout voir
CREATE POLICY "Admins can view all lot_syndic_sharing" 
ON public.lot_syndic_sharing 
FOR SELECT 
TO authenticated 
USING (public.is_admin(auth.uid()));

-- Policy: Les admins peuvent tout insérer
CREATE POLICY "Admins can insert lot_syndic_sharing" 
ON public.lot_syndic_sharing 
FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin(auth.uid()));

-- Policy: Les admins peuvent tout modifier
CREATE POLICY "Admins can update lot_syndic_sharing" 
ON public.lot_syndic_sharing 
FOR UPDATE 
TO authenticated 
USING (public.is_admin(auth.uid()));

-- Policy: Les admins peuvent tout supprimer
CREATE POLICY "Admins can delete lot_syndic_sharing" 
ON public.lot_syndic_sharing 
FOR DELETE 
TO authenticated 
USING (public.is_admin(auth.uid()));

-- Trigger pour updated_at
CREATE TRIGGER update_lot_syndic_sharing_updated_at
BEFORE UPDATE ON public.lot_syndic_sharing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
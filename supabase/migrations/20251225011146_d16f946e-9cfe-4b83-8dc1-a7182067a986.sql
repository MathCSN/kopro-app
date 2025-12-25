-- Create quotes table for the CRM system
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_company TEXT,
  client_address TEXT,
  
  -- Quote details
  residences_count INTEGER NOT NULL DEFAULT 1,
  apartments_count INTEGER NOT NULL DEFAULT 1,
  activation_price NUMERIC NOT NULL DEFAULT 500,
  monthly_price_per_apartment NUMERIC NOT NULL DEFAULT 5,
  
  -- Sender info (modifiable)
  sender_name TEXT DEFAULT 'KOPRO',
  sender_email TEXT,
  sender_phone TEXT,
  sender_address TEXT,
  sender_siren TEXT,
  sender_logo_url TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'negotiation', 'validated', 'paid', 'cancelled')),
  
  -- Payment
  payment_method TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  stripe_payment_id TEXT,
  
  -- Metadata
  notes TEXT,
  valid_until DATE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Owners can manage all quotes
CREATE POLICY "Owners can manage quotes" 
ON public.quotes 
FOR ALL 
USING (is_owner(auth.uid()));

-- Public can view their quote by token (for payment page)
CREATE POLICY "Anyone can view quote by number for payment" 
ON public.quotes 
FOR SELECT 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Generate quote number function
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.quote_number IS NULL THEN
    NEW.quote_number = 'DEV-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_quote_number_trigger
BEFORE INSERT ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.generate_quote_number();
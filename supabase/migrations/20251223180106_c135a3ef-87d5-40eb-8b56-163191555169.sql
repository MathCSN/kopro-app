-- Add join_code to lots for apartment sharing
ALTER TABLE public.lots 
ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS primary_resident_id UUID REFERENCES auth.users(id);

-- Generate join codes for existing lots
UPDATE public.lots 
SET join_code = upper(substring(md5(random()::text) from 1 for 6))
WHERE join_code IS NULL;

-- Create trigger to auto-generate join_code for new lots
CREATE OR REPLACE FUNCTION public.generate_lot_join_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.join_code IS NULL THEN
    NEW.join_code = upper(substring(md5(random()::text) from 1 for 6));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_lot_join_code
BEFORE INSERT ON public.lots
FOR EACH ROW
EXECUTE FUNCTION public.generate_lot_join_code();

-- Drop the invitation codes table (no longer needed)
DROP TABLE IF EXISTS public.residence_invitations;
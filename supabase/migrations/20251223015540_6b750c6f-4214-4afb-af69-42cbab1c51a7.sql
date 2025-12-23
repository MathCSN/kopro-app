-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the generate_vacancy_token function to use pgcrypto
CREATE OR REPLACE FUNCTION public.generate_vacancy_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.visibility = 'public_link' AND NEW.public_token IS NULL THEN
    NEW.public_token = encode(pgcrypto.gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$;
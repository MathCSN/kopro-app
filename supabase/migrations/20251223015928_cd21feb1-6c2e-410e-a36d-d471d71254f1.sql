-- Fix the generate_vacancy_token function to use gen_random_bytes correctly
-- The function is provided by pgcrypto extension and is in the public schema
CREATE OR REPLACE FUNCTION public.generate_vacancy_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.visibility = 'public_link' AND NEW.public_token IS NULL THEN
    NEW.public_token = encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$;
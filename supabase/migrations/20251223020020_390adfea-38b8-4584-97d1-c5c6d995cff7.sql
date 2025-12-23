-- Fix the generate_vacancy_token function to use md5 with random for generating tokens
-- This approach doesn't require pgcrypto
CREATE OR REPLACE FUNCTION public.generate_vacancy_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.visibility = 'public_link' AND NEW.public_token IS NULL THEN
    -- Generate a unique token using md5 of uuid + timestamp
    NEW.public_token = md5(gen_random_uuid()::text || clock_timestamp()::text);
  END IF;
  RETURN NEW;
END;
$$;

-- Fix security warnings: Set search_path on trigger functions

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_vacancy_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.visibility = 'public_link' AND NEW.public_token IS NULL THEN
    NEW.public_token = encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

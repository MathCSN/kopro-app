-- Add type column to agencies table to distinguish between bailleur and syndic
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'bailleur';

-- Add check constraint for valid types
ALTER TABLE public.agencies DROP CONSTRAINT IF EXISTS agencies_type_check;
ALTER TABLE public.agencies ADD CONSTRAINT agencies_type_check CHECK (type IN ('bailleur', 'syndic'));
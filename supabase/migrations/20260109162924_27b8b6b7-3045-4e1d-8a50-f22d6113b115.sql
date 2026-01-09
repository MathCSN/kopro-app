-- Add policy to allow any authenticated user to view basic lot info for joining residences
-- This is needed because users need to see available lots BEFORE they have a role in the residence

CREATE POLICY "Allow authenticated users to view lots for joining" 
ON public.lots
FOR SELECT
TO authenticated
USING (true);

-- Note: This allows viewing lot basic info, but actual management is still restricted by other policies
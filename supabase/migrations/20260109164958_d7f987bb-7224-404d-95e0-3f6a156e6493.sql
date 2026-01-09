-- Allow authenticated users to insert their own 'resident' role when joining a residence
-- This is essential for the resident onboarding flow
CREATE POLICY "Allow users to join a residence as resident"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'resident'::app_role
);

-- Allow authenticated users to insert their own occupancies when joining a lot
CREATE POLICY "Allow users to create their own occupancy"
ON public.occupancies
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update lots to set themselves as primary resident (only if lot has no primary resident)
CREATE POLICY "Allow users to claim available lots"
ON public.lots
FOR UPDATE
TO authenticated
USING (primary_resident_id IS NULL)
WITH CHECK (primary_resident_id = auth.uid());
-- Allow users to create their own manager role during trial signup
CREATE POLICY "Users can assign manager role to themselves during signup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'manager'::app_role
  AND agency_id IS NOT NULL
  -- Verify user owns the agency they're claiming manager role for
  AND EXISTS (
    SELECT 1 FROM public.agencies 
    WHERE id = agency_id 
    AND owner_id = auth.uid()
  )
);
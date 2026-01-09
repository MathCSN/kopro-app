-- Allow authenticated residence members to read their agency row (so Directory can show agency owner/contact)
CREATE POLICY "Residence members can view their agency"
ON public.agencies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.residences r
    WHERE r.agency_id = agencies.id
      AND public.has_residence_access(auth.uid(), r.id)
  )
);

-- Allow authenticated residence members to read management roles (manager/cs) tied to their residence or agency.
-- Keeps sensitive roles hidden by default.
CREATE POLICY "Residence members can view management roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  public.is_owner(auth.uid())
  OR user_id = auth.uid()
  OR (
    role = ANY (ARRAY['manager'::public.app_role, 'cs'::public.app_role])
    AND (
      (residence_id IS NOT NULL AND public.has_residence_access(auth.uid(), residence_id))
      OR (
        agency_id IS NOT NULL AND EXISTS (
          SELECT 1
          FROM public.residences r
          WHERE r.agency_id = user_roles.agency_id
            AND public.has_residence_access(auth.uid(), r.id)
        )
      )
    )
  )
);
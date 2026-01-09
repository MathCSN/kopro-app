-- Drop the existing policy that doesn't work properly for INSERT
DROP POLICY IF EXISTS "Lots manageable by managers" ON public.lots;

-- Create separate policies for each operation with proper expressions
-- Policy for SELECT (managers can view all lots in their residences)
CREATE POLICY "Lots manageable by managers SELECT"
ON public.lots
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND (
      user_roles.role = 'owner'::app_role
      OR (
        user_roles.role IN ('manager'::app_role, 'admin'::app_role)
        AND user_roles.residence_id = lots.residence_id
      )
    )
  )
);

-- Policy for INSERT (managers can create lots in their residences)
CREATE POLICY "Lots manageable by managers INSERT"
ON public.lots
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND (
      user_roles.role = 'owner'::app_role
      OR (
        user_roles.role IN ('manager'::app_role, 'admin'::app_role)
        AND user_roles.residence_id = lots.residence_id
      )
    )
  )
);

-- Policy for UPDATE (managers can update lots in their residences)
CREATE POLICY "Lots manageable by managers UPDATE"
ON public.lots
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND (
      user_roles.role = 'owner'::app_role
      OR (
        user_roles.role IN ('manager'::app_role, 'admin'::app_role)
        AND user_roles.residence_id = lots.residence_id
      )
    )
  )
);

-- Policy for DELETE (managers can delete lots in their residences)
CREATE POLICY "Lots manageable by managers DELETE"
ON public.lots
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND (
      user_roles.role = 'owner'::app_role
      OR (
        user_roles.role IN ('manager'::app_role, 'admin'::app_role)
        AND user_roles.residence_id = lots.residence_id
      )
    )
  )
);
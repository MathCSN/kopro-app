-- Fix RLS for public.lots INSERT/UPDATE/DELETE for global admins/owners

-- Remove the policies added previously
DROP POLICY IF EXISTS "Lots manageable by managers SELECT" ON public.lots;
DROP POLICY IF EXISTS "Lots manageable by managers INSERT" ON public.lots;
DROP POLICY IF EXISTS "Lots manageable by managers UPDATE" ON public.lots;
DROP POLICY IF EXISTS "Lots manageable by managers DELETE" ON public.lots;

-- Create one policy for all write operations (and select) for managers + platform admins/owners
CREATE POLICY "Lots manageable by managers"
ON public.lots
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND (
        ur.role IN ('owner'::app_role, 'admin'::app_role)
        OR (ur.role = 'manager'::app_role AND ur.residence_id = lots.residence_id)
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND (
        ur.role IN ('owner'::app_role, 'admin'::app_role)
        OR (ur.role = 'manager'::app_role AND ur.residence_id = residence_id)
      )
  )
);
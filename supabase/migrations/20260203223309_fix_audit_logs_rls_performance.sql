/*
  # Correction finale de la policy audit_logs

  ## Changements
  
  Optimise la policy "Users can insert their own audit logs" pour utiliser (select auth.uid())
  au lieu de auth.uid() pour améliorer les performances.
*/

DROP POLICY IF EXISTS "Users can insert their own audit logs" ON audit_logs;

CREATE POLICY "Users can insert their own audit logs"
ON audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (select auth.uid())
  AND (
    residence_id IS NULL
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.residence_id = audit_logs.residence_id
      AND user_roles.user_id = (select auth.uid())
    )
  )
);

-- Optimize "Owners can view all audit logs" policy
DROP POLICY IF EXISTS "Owners can view all audit logs" ON audit_logs;

CREATE POLICY "Owners can view all audit logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (select auth.uid())
    AND user_roles.role = 'owner'
  )
);
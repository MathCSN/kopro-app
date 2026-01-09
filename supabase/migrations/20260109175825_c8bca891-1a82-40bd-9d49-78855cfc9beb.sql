-- Fix permissive audit log insert policy (previously WITH CHECK (true))
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='audit_logs'
      AND policyname='System can insert audit logs'
  ) THEN
    EXECUTE 'DROP POLICY "System can insert audit logs" ON public.audit_logs';
  END IF;
END $$;

CREATE POLICY "Users can insert their own audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    residence_id IS NULL
    OR public.has_residence_access(auth.uid(), residence_id)
  )
);

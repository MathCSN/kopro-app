-- Drop existing conflicting policies
DROP POLICY IF EXISTS "trial_admin_all" ON public.trial_accounts;
DROP POLICY IF EXISTS "Users can create their own trial account" ON public.trial_accounts;
DROP POLICY IF EXISTS "Users can update their own trial account" ON public.trial_accounts;
DROP POLICY IF EXISTS "Users can view their own trial" ON public.trial_accounts;
DROP POLICY IF EXISTS "trial_insert_own" ON public.trial_accounts;
DROP POLICY IF EXISTS "trial_select_own" ON public.trial_accounts;
DROP POLICY IF EXISTS "trial_update_own" ON public.trial_accounts;

-- Create comprehensive admin policies with proper permissions
CREATE POLICY "admin_can_select_all_trials"
ON public.trial_accounts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_can_insert_trials"
ON public.trial_accounts
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_can_update_trials"
ON public.trial_accounts
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_can_delete_trials"
ON public.trial_accounts
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- User policies for their own trial accounts
CREATE POLICY "users_can_view_own_trial"
ON public.trial_accounts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "users_can_insert_own_trial"
ON public.trial_accounts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "users_can_update_own_trial"
ON public.trial_accounts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
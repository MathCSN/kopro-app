-- Drop existing conflicting policies and recreate with proper names
DROP POLICY IF EXISTS "Users can create own agency during signup" ON public.agencies;
DROP POLICY IF EXISTS "Agency owners can update their agency" ON public.agencies;
DROP POLICY IF EXISTS "Users can read own agency" ON public.agencies;
DROP POLICY IF EXISTS "Users can create own trial account" ON public.trial_accounts;
DROP POLICY IF EXISTS "Users can update own trial account" ON public.trial_accounts;
DROP POLICY IF EXISTS "Users can read own trial account" ON public.trial_accounts;
DROP POLICY IF EXISTS "Admins can read all trial accounts" ON public.trial_accounts;
DROP POLICY IF EXISTS "Admins can manage trial accounts" ON public.trial_accounts;
DROP POLICY IF EXISTS "Admins can read all agencies" ON public.agencies;
DROP POLICY IF EXISTS "Admins can manage agencies" ON public.agencies;
DROP POLICY IF EXISTS "Admins can manage all residences" ON public.residences;
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;

-- Agencies: Users can create their own agency
CREATE POLICY "agency_insert_own"
ON public.agencies FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Agencies: Users can update their own agency  
CREATE POLICY "agency_update_own"
ON public.agencies FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Agencies: Users can read their own agency
CREATE POLICY "agency_select_own"
ON public.agencies FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- Agencies: Admins can do everything
CREATE POLICY "agency_admin_all"
ON public.agencies FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trial accounts: Users can create their own
CREATE POLICY "trial_insert_own"
ON public.trial_accounts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Trial accounts: Users can update their own
CREATE POLICY "trial_update_own"
ON public.trial_accounts FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Trial accounts: Users can read their own
CREATE POLICY "trial_select_own"
ON public.trial_accounts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Trial accounts: Admins can do everything
CREATE POLICY "trial_admin_all"
ON public.trial_accounts FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Residences: Admins can do everything
CREATE POLICY "residences_admin_all"
ON public.residences FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- User roles: Admins can delete any role
CREATE POLICY "user_roles_admin_delete"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
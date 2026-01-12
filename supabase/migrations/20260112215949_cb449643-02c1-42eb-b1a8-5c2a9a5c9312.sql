-- Allow authenticated users to insert their own trial account during signup
CREATE POLICY "Users can create their own trial account"
ON public.trial_accounts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to update their own trial account
CREATE POLICY "Users can update their own trial account"
ON public.trial_accounts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
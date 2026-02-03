/*
  # Optimisation des policies RLS - Performance

  ## Changements
  
  Cette migration optimise les policies RLS en remplaçant `auth.uid()` par `(select auth.uid())`.
  Cela améliore significativement les performances à grande échelle.
  
  ### Tables optimisées:
  - profiles
  - user_roles
  - residences
  - units
  - vacancies
  - application_form_templates
  - applications
  - reservations
  - documents
  - packages
  - visitors
  - general_assemblies
  - ag_votes
  - payments
  - marketplace_listings
  - conversations
  - messages
  - posts
  - tenant_documents
  - document_requests
  - rent_receipts
  - post_likes
  - post_comments
  - vault_documents
  - event_rsvps
  - smtp_configs
  - service_providers
  - residence_invitations
  - push_subscriptions
  - residence_ai_settings
  - ai_knowledge_documents
  - ai_conversations
  - ai_messages
  - agency_subscriptions
  - apartment_requests
  - role_permissions
  - crm_contacts
  - crm_activities
  - accounting_entries
  - agencies
  - trial_accounts
  - lots
  - occupancies
  - ticket_comments
  - buildings
  - tickets
*/

-- profiles
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- user_roles  
DROP POLICY IF EXISTS "Owners can view all roles" ON user_roles;
CREATE POLICY "Owners can view all roles" ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles owner_role
      WHERE owner_role.user_id = (select auth.uid())
      AND owner_role.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Owners can insert roles" ON user_roles;
CREATE POLICY "Owners can insert roles" ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles owner_role
      WHERE owner_role.user_id = (select auth.uid())
      AND owner_role.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Owners can update roles" ON user_roles;
CREATE POLICY "Owners can update roles" ON user_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles owner_role
      WHERE owner_role.user_id = (select auth.uid())
      AND owner_role.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles owner_role
      WHERE owner_role.user_id = (select auth.uid())
      AND owner_role.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Owners can delete roles" ON user_roles;
CREATE POLICY "Owners can delete roles" ON user_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles owner_role
      WHERE owner_role.user_id = (select auth.uid())
      AND owner_role.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Residence members can view management roles" ON user_roles;
CREATE POLICY "Residence members can view management roles" ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur2
      WHERE ur2.user_id = (select auth.uid())
      AND ur2.residence_id = user_roles.residence_id
    )
    AND user_roles.role = 'manager'
  );

DROP POLICY IF EXISTS "Allow users to join a residence as resident" ON user_roles;
CREATE POLICY "Allow users to join a residence as resident" ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    AND role = 'resident'
  );

-- residences
DROP POLICY IF EXISTS "Users can view their residences" ON residences;
CREATE POLICY "Users can view their residences" ON residences
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.residence_id = residences.id
      AND user_roles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Owners can insert residences" ON residences;
CREATE POLICY "Owners can insert residences" ON residences
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (select auth.uid())
      AND user_roles.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Owners can update residences" ON residences;
CREATE POLICY "Owners can update residences" ON residences
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (select auth.uid())
      AND user_roles.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (select auth.uid())
      AND user_roles.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Owners can delete residences" ON residences;
CREATE POLICY "Owners can delete residences" ON residences
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (select auth.uid())
      AND user_roles.role = 'owner'
    )
  );

-- units
DROP POLICY IF EXISTS "Units viewable by residence members" ON units;
CREATE POLICY "Units viewable by residence members" ON units
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.residence_id = units.residence_id
      AND user_roles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Units manageable by managers" ON units;
CREATE POLICY "Units manageable by managers" ON units
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.residence_id = units.residence_id
      AND user_roles.user_id = (select auth.uid())
      AND user_roles.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.residence_id = units.residence_id
      AND user_roles.user_id = (select auth.uid())
      AND user_roles.role = 'manager'
    )
  );

-- vacancies
DROP POLICY IF EXISTS "Vacancies viewable by residence members and managers" ON vacancies;
CREATE POLICY "Vacancies viewable by residence members and managers" ON vacancies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM units
      JOIN user_roles ON user_roles.residence_id = units.residence_id
      WHERE units.id = vacancies.unit_id
      AND user_roles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Vacancies manageable by managers" ON vacancies;
CREATE POLICY "Vacancies manageable by managers" ON vacancies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM units
      JOIN user_roles ON user_roles.residence_id = units.residence_id
      WHERE units.id = vacancies.unit_id
      AND user_roles.user_id = (select auth.uid())
      AND user_roles.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM units
      JOIN user_roles ON user_roles.residence_id = units.residence_id
      WHERE units.id = vacancies.unit_id
      AND user_roles.user_id = (select auth.uid())
      AND user_roles.role = 'manager'
    )
  );

-- buildings
DROP POLICY IF EXISTS "Buildings viewable by residence members" ON buildings;
CREATE POLICY "Buildings viewable by residence members" ON buildings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.residence_id = buildings.residence_id
      AND user_roles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Buildings manageable by managers" ON buildings;
CREATE POLICY "Buildings manageable by managers" ON buildings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.residence_id = buildings.residence_id
      AND user_roles.user_id = (select auth.uid())
      AND user_roles.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.residence_id = buildings.residence_id
      AND user_roles.user_id = (select auth.uid())
      AND user_roles.role = 'manager'
    )
  );

-- lots
DROP POLICY IF EXISTS "Lots viewable by residence members" ON lots;
CREATE POLICY "Lots viewable by residence members" ON lots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.residence_id = lots.residence_id
      AND user_roles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Lots manageable by managers" ON lots;
CREATE POLICY "Lots manageable by managers" ON lots
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.residence_id = lots.residence_id
      AND user_roles.user_id = (select auth.uid())
      AND user_roles.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.residence_id = lots.residence_id
      AND user_roles.user_id = (select auth.uid())
      AND user_roles.role = 'manager'
    )
  );

DROP POLICY IF EXISTS "Allow users to claim available lots" ON lots;
CREATE POLICY "Allow users to claim available lots" ON lots
  FOR UPDATE
  TO authenticated
  USING (
    owner_id IS NULL
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.residence_id = lots.residence_id
      AND user_roles.user_id = (select auth.uid())
    )
  )
  WITH CHECK (owner_id = (select auth.uid()));

-- occupancies
DROP POLICY IF EXISTS "Occupancies viewable by residence members" ON occupancies;
CREATE POLICY "Occupancies viewable by residence members" ON occupancies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lots
      JOIN user_roles ON user_roles.residence_id = lots.residence_id
      WHERE lots.id = occupancies.lot_id
      AND user_roles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Occupancies manageable by managers" ON occupancies;
CREATE POLICY "Occupancies manageable by managers" ON occupancies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lots
      JOIN user_roles ON user_roles.residence_id = lots.residence_id
      WHERE lots.id = occupancies.lot_id
      AND user_roles.user_id = (select auth.uid())
      AND user_roles.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lots
      JOIN user_roles ON user_roles.residence_id = lots.residence_id
      WHERE lots.id = occupancies.lot_id
      AND user_roles.user_id = (select auth.uid())
      AND user_roles.role = 'manager'
    )
  );

DROP POLICY IF EXISTS "Allow users to create their own occupancy" ON occupancies;
CREATE POLICY "Allow users to create their own occupancy" ON occupancies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
  );

-- tickets
DROP POLICY IF EXISTS "Users can view tickets in their residence" ON tickets;
CREATE POLICY "Users can view tickets in their residence" ON tickets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.residence_id = tickets.residence_id
      AND user_roles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create tickets in their residence" ON tickets;
CREATE POLICY "Users can create tickets in their residence" ON tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.residence_id = tickets.residence_id
      AND user_roles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Managers can manage tickets" ON tickets;
CREATE POLICY "Managers can manage tickets" ON tickets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.residence_id = tickets.residence_id
      AND user_roles.user_id = (select auth.uid())
      AND user_roles.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.residence_id = tickets.residence_id
      AND user_roles.user_id = (select auth.uid())
      AND user_roles.role = 'manager'
    )
  );

DROP POLICY IF EXISTS "Users can update their own tickets" ON tickets;
CREATE POLICY "Users can update their own tickets" ON tickets
  FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

-- ticket_comments
DROP POLICY IF EXISTS "Users can view ticket comments" ON ticket_comments;
CREATE POLICY "Users can view ticket comments" ON ticket_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      JOIN user_roles ON user_roles.residence_id = tickets.residence_id
      WHERE tickets.id = ticket_comments.ticket_id
      AND user_roles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create comments" ON ticket_comments;
CREATE POLICY "Users can create comments" ON ticket_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM tickets
      JOIN user_roles ON user_roles.residence_id = tickets.residence_id
      WHERE tickets.id = ticket_comments.ticket_id
      AND user_roles.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own comments" ON ticket_comments;
CREATE POLICY "Users can update own comments" ON ticket_comments
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own comments" ON ticket_comments;
CREATE POLICY "Users can delete own comments" ON ticket_comments
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));
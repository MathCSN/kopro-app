/*
  # Ajout des index manquants sur les foreign keys

  ## Performance & Sécurité
  
  Cette migration ajoute des index sur toutes les foreign keys non indexées pour améliorer les performances des requêtes.
  
  ### Index ajoutés sur les tables suivantes:
  - accounting_entries (contact_id, quote_id, subscription_id)
  - ag_votes (proxy_for, user_id)
  - agencies (owner_id, trial_account_id)
  - ai_conversations (residence_id)
  - ai_knowledge_documents (residence_id)
  - ai_messages (conversation_id)
  - apartment_requests (assigned_lot_id, residence_id)
  - application_documents (application_id)
  - application_form_templates (created_by, residence_id)
  - applications (created_by)
  - buildings (residence_id)
  - conversation_participants (user_id)
  - conversations (residence_id)
  - crm_contacts (quote_id, subscription_id)
  - document_requests (email_template_id, residence_id)
  - documents (residence_id, uploaded_by)
  - general_assemblies (created_by, residence_id)
  - lots (building_id, owner_id, primary_resident_id)
  - marketplace_listings (residence_id, seller_id)
  - messages (conversation_id, sender_id)
  - occupancies (lot_id, user_id)
  - packages (recipient_id, residence_id)
  - payments (lot_id, residence_id, user_id)
  - post_comments (post_id)
  - posts (author_id, residence_id)
  - rent_receipts (lot_id, residence_id)
  - reservations (residence_id, user_id)
  - residence_invitations (accepted_by, invited_by)
  - residences (agency_id)
  - service_providers (residence_id)
  - tenant_documents (occupancy_id, residence_id)
  - tenant_dossiers (application_id, residence_id, tenant_user_id, unit_id)
  - ticket_comments (ticket_id)
  - tickets (assignee_id, created_by, residence_id)
  - trial_accounts (agency_id, created_by)
  - units (lot_id)
  - user_roles (agency_id)
  - vacancies (created_by, template_id, unit_id)
  - visitors (host_id, residence_id)
*/

-- accounting_entries
CREATE INDEX IF NOT EXISTS idx_accounting_entries_contact_id ON accounting_entries(contact_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_quote_id ON accounting_entries(quote_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_subscription_id ON accounting_entries(subscription_id);

-- ag_votes
CREATE INDEX IF NOT EXISTS idx_ag_votes_proxy_for ON ag_votes(proxy_for);
CREATE INDEX IF NOT EXISTS idx_ag_votes_user_id ON ag_votes(user_id);

-- agencies
CREATE INDEX IF NOT EXISTS idx_agencies_owner_id ON agencies(owner_id);
CREATE INDEX IF NOT EXISTS idx_agencies_trial_account_id ON agencies(trial_account_id);

-- ai_conversations
CREATE INDEX IF NOT EXISTS idx_ai_conversations_residence_id ON ai_conversations(residence_id);

-- ai_knowledge_documents
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_documents_residence_id ON ai_knowledge_documents(residence_id);

-- ai_messages
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);

-- apartment_requests
CREATE INDEX IF NOT EXISTS idx_apartment_requests_assigned_lot_id ON apartment_requests(assigned_lot_id);
CREATE INDEX IF NOT EXISTS idx_apartment_requests_residence_id ON apartment_requests(residence_id);

-- application_documents
CREATE INDEX IF NOT EXISTS idx_application_documents_application_id ON application_documents(application_id);

-- application_form_templates
CREATE INDEX IF NOT EXISTS idx_application_form_templates_created_by ON application_form_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_application_form_templates_residence_id ON application_form_templates(residence_id);

-- applications
CREATE INDEX IF NOT EXISTS idx_applications_created_by ON applications(created_by);

-- buildings
CREATE INDEX IF NOT EXISTS idx_buildings_residence_id ON buildings(residence_id);

-- conversation_participants
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);

-- conversations
CREATE INDEX IF NOT EXISTS idx_conversations_residence_id ON conversations(residence_id);

-- crm_contacts
CREATE INDEX IF NOT EXISTS idx_crm_contacts_quote_id ON crm_contacts(quote_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_subscription_id ON crm_contacts(subscription_id);

-- document_requests
CREATE INDEX IF NOT EXISTS idx_document_requests_email_template_id ON document_requests(email_template_id);
CREATE INDEX IF NOT EXISTS idx_document_requests_residence_id ON document_requests(residence_id);

-- documents
CREATE INDEX IF NOT EXISTS idx_documents_residence_id ON documents(residence_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- general_assemblies
CREATE INDEX IF NOT EXISTS idx_general_assemblies_created_by ON general_assemblies(created_by);
CREATE INDEX IF NOT EXISTS idx_general_assemblies_residence_id ON general_assemblies(residence_id);

-- lots
CREATE INDEX IF NOT EXISTS idx_lots_building_id ON lots(building_id);
CREATE INDEX IF NOT EXISTS idx_lots_owner_id ON lots(owner_id);
CREATE INDEX IF NOT EXISTS idx_lots_primary_resident_id ON lots(primary_resident_id);

-- marketplace_listings
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_residence_id ON marketplace_listings(residence_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller_id ON marketplace_listings(seller_id);

-- messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- occupancies
CREATE INDEX IF NOT EXISTS idx_occupancies_lot_id ON occupancies(lot_id);
CREATE INDEX IF NOT EXISTS idx_occupancies_user_id ON occupancies(user_id);

-- packages
CREATE INDEX IF NOT EXISTS idx_packages_recipient_id ON packages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_packages_residence_id ON packages(residence_id);

-- payments
CREATE INDEX IF NOT EXISTS idx_payments_lot_id ON payments(lot_id);
CREATE INDEX IF NOT EXISTS idx_payments_residence_id ON payments(residence_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- post_comments
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);

-- posts
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_residence_id ON posts(residence_id);

-- rent_receipts
CREATE INDEX IF NOT EXISTS idx_rent_receipts_lot_id ON rent_receipts(lot_id);
CREATE INDEX IF NOT EXISTS idx_rent_receipts_residence_id ON rent_receipts(residence_id);

-- reservations
CREATE INDEX IF NOT EXISTS idx_reservations_residence_id ON reservations(residence_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);

-- residence_invitations
CREATE INDEX IF NOT EXISTS idx_residence_invitations_accepted_by ON residence_invitations(accepted_by);
CREATE INDEX IF NOT EXISTS idx_residence_invitations_invited_by ON residence_invitations(invited_by);

-- residences
CREATE INDEX IF NOT EXISTS idx_residences_agency_id ON residences(agency_id);

-- service_providers
CREATE INDEX IF NOT EXISTS idx_service_providers_residence_id ON service_providers(residence_id);

-- tenant_documents
CREATE INDEX IF NOT EXISTS idx_tenant_documents_occupancy_id ON tenant_documents(occupancy_id);
CREATE INDEX IF NOT EXISTS idx_tenant_documents_residence_id ON tenant_documents(residence_id);

-- tenant_dossiers
CREATE INDEX IF NOT EXISTS idx_tenant_dossiers_application_id ON tenant_dossiers(application_id);
CREATE INDEX IF NOT EXISTS idx_tenant_dossiers_residence_id ON tenant_dossiers(residence_id);
CREATE INDEX IF NOT EXISTS idx_tenant_dossiers_tenant_user_id ON tenant_dossiers(tenant_user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_dossiers_unit_id ON tenant_dossiers(unit_id);

-- ticket_comments
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);

-- tickets
CREATE INDEX IF NOT EXISTS idx_tickets_assignee_id ON tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_residence_id ON tickets(residence_id);

-- trial_accounts
CREATE INDEX IF NOT EXISTS idx_trial_accounts_agency_id ON trial_accounts(agency_id);
CREATE INDEX IF NOT EXISTS idx_trial_accounts_created_by ON trial_accounts(created_by);

-- units
CREATE INDEX IF NOT EXISTS idx_units_lot_id ON units(lot_id);

-- user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_agency_id ON user_roles(agency_id);

-- vacancies
CREATE INDEX IF NOT EXISTS idx_vacancies_created_by ON vacancies(created_by);
CREATE INDEX IF NOT EXISTS idx_vacancies_template_id ON vacancies(template_id);
CREATE INDEX IF NOT EXISTS idx_vacancies_unit_id ON vacancies(unit_id);

-- visitors
CREATE INDEX IF NOT EXISTS idx_visitors_host_id ON visitors(host_id);
CREATE INDEX IF NOT EXISTS idx_visitors_residence_id ON visitors(residence_id);
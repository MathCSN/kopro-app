/*
  # Mise à jour de la table email_templates

  1. Modifications
    - Ajouter colonne slug si elle n'existe pas
    - Ajouter colonne html_content si elle n'existe pas
    - Ajouter colonne is_active si elle n'existe pas
    - Peupler les nouvelles colonnes avec les données existantes
    - Créer les index nécessaires

  2. Notes
    - La table existe déjà avec les colonnes: id, residence_id, name, subject, body, type, variables, etc.
    - On s'assure que toutes les colonnes nécessaires existent
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_templates' AND column_name = 'slug'
  ) THEN
    ALTER TABLE email_templates ADD COLUMN slug text;
    UPDATE email_templates SET slug = type WHERE slug IS NULL AND type IS NOT NULL;
    UPDATE email_templates SET slug = lower(replace(name, ' ', '_')) WHERE slug IS NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_templates' AND column_name = 'html_content'
  ) THEN
    ALTER TABLE email_templates ADD COLUMN html_content text;
    UPDATE email_templates SET html_content = body WHERE html_content IS NULL AND body IS NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_templates' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE email_templates ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_email_templates_slug'
  ) THEN
    CREATE INDEX idx_email_templates_slug ON email_templates(slug);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_email_templates_residence'
  ) THEN
    CREATE INDEX idx_email_templates_residence ON email_templates(residence_id);
  END IF;
END $$;

ALTER TABLE email_templates ALTER COLUMN slug SET NOT NULL;
ALTER TABLE email_templates ALTER COLUMN html_content SET NOT NULL;

INSERT INTO email_templates (name, slug, subject, html_content, body, type, variables, is_active)
SELECT * FROM (VALUES
  ('Email de bienvenue', 'welcome', 'Bienvenue sur KOPRO', '<h1>Bienvenue {{name}}</h1><p>Nous sommes ravis de vous accueillir dans votre résidence.</p><p>Votre compte a été créé avec succès.</p>', '<h1>Bienvenue {{name}}</h1><p>Nous sommes ravis de vous accueillir dans votre résidence.</p><p>Votre compte a été créé avec succès.</p>', 'welcome', '["name"]'::jsonb, true),
  ('Notification nouveau ticket', 'new_ticket', 'Nouveau ticket créé', '<h1>Nouveau ticket #{{ticket_number}}</h1><p>Un nouveau ticket a été créé par {{creator_name}}.</p><p><strong>Titre :</strong> {{ticket_title}}</p><p><strong>Description :</strong> {{ticket_description}}</p>', '<h1>Nouveau ticket #{{ticket_number}}</h1><p>Un nouveau ticket a été créé par {{creator_name}}.</p><p><strong>Titre :</strong> {{ticket_title}}</p><p><strong>Description :</strong> {{ticket_description}}</p>', 'new_ticket', '["ticket_number", "creator_name", "ticket_title", "ticket_description"]'::jsonb, true),
  ('Notification AG', 'general_assembly', 'Assemblée Générale - {{ag_title}}', '<h1>{{ag_title}}</h1><p>Une assemblée générale est programmée le {{ag_date}} à {{ag_time}}.</p><p><strong>Lieu :</strong> {{ag_location}}</p><p>{{ag_description}}</p>', '<h1>{{ag_title}}</h1><p>Une assemblée générale est programmée le {{ag_date}} à {{ag_time}}.</p><p><strong>Lieu :</strong> {{ag_location}}</p><p>{{ag_description}}</p>', 'general_assembly', '["ag_title", "ag_date", "ag_time", "ag_location", "ag_description"]'::jsonb, true),
  ('Rappel de paiement', 'payment_reminder', 'Rappel de paiement', '<h1>Rappel de paiement</h1><p>Bonjour {{name}},</p><p>Nous vous rappelons qu''un paiement de <strong>{{amount}}€</strong> est attendu avant le {{due_date}}.</p><p>Référence : {{reference}}</p>', '<h1>Rappel de paiement</h1><p>Bonjour {{name}},</p><p>Nous vous rappelons qu''un paiement de <strong>{{amount}}€</strong> est attendu avant le {{due_date}}.</p><p>Référence : {{reference}}</p>', 'payment_reminder', '["name", "amount", "due_date", "reference"]'::jsonb, true)
) AS t(name, slug, subject, html_content, body, type, variables, is_active)
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE slug = t.slug);

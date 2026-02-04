/*
  # Créer la table des tokens de réinitialisation de mot de passe

  1. Nouvelle table
    - `password_reset_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key vers auth.users)
      - `token` (text, unique) - Le token de réinitialisation
      - `expires_at` (timestamptz) - Date d'expiration du token
      - `used` (boolean) - Si le token a été utilisé
      - `created_at` (timestamptz)

  2. Sécurité
    - Enable RLS
    - Pas de policies publiques (géré uniquement par edge functions)

  3. Index
    - Index sur token pour recherche rapide
    - Index sur user_id
*/

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Fonction pour nettoyer les anciens tokens expirés (à exécuter périodiquement)
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM password_reset_tokens
  WHERE expires_at < now() - INTERVAL '7 days';
END;
$$;
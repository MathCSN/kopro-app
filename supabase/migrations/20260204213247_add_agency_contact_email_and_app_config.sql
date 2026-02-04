/*
  # Add Agency Contact Email and Noreply Email Configuration

  1. Changes to `agencies` table
    - Add `contact_email` column to store the reply-to email for each agency
    - This email will be used as the "Reply-To" address in all emails sent by the agency

  2. Security on `app_config`
    - Ensure RLS policies exist for owner and admin access
    
  3. Initial Data
    - Insert default noreply email configuration
*/

-- Add contact_email column to agencies table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agencies' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE agencies ADD COLUMN contact_email text;
    COMMENT ON COLUMN agencies.contact_email IS 'Reply-to email address used in emails sent by this agency';
  END IF;
END $$;

-- Ensure RLS is enabled on app_config
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view app config" ON app_config;
DROP POLICY IF EXISTS "Admins can insert app config" ON app_config;
DROP POLICY IF EXISTS "Admins can update app config" ON app_config;
DROP POLICY IF EXISTS "Admins can delete app config" ON app_config;

-- Policy: Only owner and admin can read app_config
CREATE POLICY "Admins can view app config"
  ON app_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('owner', 'admin')
    )
  );

-- Policy: Only owner and admin can insert app_config
CREATE POLICY "Admins can insert app config"
  ON app_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('owner', 'admin')
    )
  );

-- Policy: Only owner and admin can update app_config
CREATE POLICY "Admins can update app config"
  ON app_config
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('owner', 'admin')
    )
  );

-- Policy: Only owner and admin can delete app_config
CREATE POLICY "Admins can delete app config"
  ON app_config
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('owner', 'admin')
    )
  );

-- Insert default noreply email configuration
INSERT INTO app_config (key, value, is_encrypted)
VALUES (
  'noreply_email',
  'noreply@kopro.app',
  false
)
ON CONFLICT (key) DO NOTHING;

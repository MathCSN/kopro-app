-- Error Logging System
--
-- 1. New Tables
--    - error_logs: Store application error logs
--
-- 2. Security
--    - Enable RLS
--    - Users can view their own error logs
--    - Authenticated users can insert error logs
--
-- 3. Indexes
--    - Index on user_id, error_type, severity, created_at

CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type text NOT NULL,
  error_message text NOT NULL,
  error_stack text,
  severity text NOT NULL DEFAULT 'MEDIUM',
  user_message text NOT NULL,
  status_code integer,
  details jsonb,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  url text NOT NULL,
  user_agent text NOT NULL,
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);

CREATE POLICY "Users can view their own error logs"
  ON error_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Authenticated users can insert error logs"
  ON error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
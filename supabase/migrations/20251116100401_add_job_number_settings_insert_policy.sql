-- Add INSERT policy for job_number_settings
-- Allow owners and admins to insert new settings if none exist
CREATE POLICY "Owners and admins can insert job number settings"
  ON job_number_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin')
    )
  );


-- Create audit_log table for tracking all system activities
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- e.g., 'user.created', 'user.updated', 'user.deleted', 'user.role_changed', 'invite.sent', 'invite.accepted', 'invite.expired', 'job.created', 'job.updated', 'job.deleted', 'job.status_changed'
  resource_type TEXT, -- e.g., 'user', 'job', 'invitation'
  resource_id UUID,
  details JSONB, -- Additional details about the action
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource_type ON public.audit_log(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource_id ON public.audit_log(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Owners and admins can view all audit logs
CREATE POLICY "Owners and admins can view all audit logs"
  ON public.audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON public.audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add pending_invitations tracking to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for pending invitations
CREATE INDEX IF NOT EXISTS idx_users_pending_invitations 
ON public.users(invited_at, invitation_accepted_at) 
WHERE invitation_accepted_at IS NULL AND invited_at IS NOT NULL;

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO public.audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent
  )
  VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log user role changes
CREATE OR REPLACE FUNCTION public.log_user_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    PERFORM public.log_audit_event(
      auth.uid(),
      'user.role_changed',
      'user',
      NEW.id,
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'user_email', NEW.email
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_role_changed ON public.users;
CREATE TRIGGER on_user_role_changed
  AFTER UPDATE OF role ON public.users
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.log_user_role_change();


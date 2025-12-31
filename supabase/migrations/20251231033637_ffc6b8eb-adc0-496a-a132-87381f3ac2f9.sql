-- Trigger to prevent self-assignment of admin role
-- Only existing admins can assign the admin role to others

CREATE OR REPLACE FUNCTION public.protect_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_is_admin boolean;
BEGIN
  -- Check if inserting or updating to admin role
  IF NEW.role = 'admin' THEN
    -- Check if the current user is an admin
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    ) INTO current_user_is_admin;
    
    -- Block if not an admin trying to assign admin role
    IF NOT current_user_is_admin THEN
      RAISE EXCEPTION 'Seul un administrateur peut attribuer le rôle admin';
    END IF;
    
    -- Block self-assignment of admin role
    IF NEW.user_id = auth.uid() AND TG_OP = 'INSERT' THEN
      -- Allow only if there are no other admins (first admin case)
      IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin' AND user_id != NEW.user_id) THEN
        RAISE EXCEPTION 'Vous ne pouvez pas vous attribuer le rôle admin';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on user_roles table
DROP TRIGGER IF EXISTS protect_admin_role_trigger ON public.user_roles;

CREATE TRIGGER protect_admin_role_trigger
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.protect_admin_role();
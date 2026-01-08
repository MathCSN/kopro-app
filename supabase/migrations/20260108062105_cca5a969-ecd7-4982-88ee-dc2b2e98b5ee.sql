-- Désactiver temporairement le trigger
DROP TRIGGER IF EXISTS protect_admin_role_trigger ON public.user_roles;

-- Mettre à jour le rôle
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = '466cff6c-b859-4217-892d-63b42f394948';

-- Réactiver le trigger
CREATE TRIGGER protect_admin_role_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_admin_role();
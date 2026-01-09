-- Add job_title column to user_roles table for collaborator titles
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.user_roles.job_title IS 'Job title for collaborators (e.g., Chargé de gestion, Comptable, etc.)';
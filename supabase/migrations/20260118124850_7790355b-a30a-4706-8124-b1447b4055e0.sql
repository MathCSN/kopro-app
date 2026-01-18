-- Fix overly permissive RLS policies
DROP POLICY IF EXISTS "System can insert syndic subscriptions" ON public.syndic_subscriptions;
DROP POLICY IF EXISTS "System can update syndic subscriptions" ON public.syndic_subscriptions;

-- Fix function search_path (linter 0011)
CREATE OR REPLACE FUNCTION public.is_syndic_subscription_active(p_user_id uuid, p_residence_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.syndic_subscriptions
    WHERE syndic_user_id = p_user_id
      AND residence_id = p_residence_id
      AND (
        (status = 'active' AND current_period_end > now())
        OR
        (status = 'trial' AND trial_ends_at > now())
      )
  );
END;
$$;
-- Create syndic_subscriptions table for tracking paid access per residence
CREATE TABLE public.syndic_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syndic_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'cancelled', 'trial')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(syndic_user_id, residence_id)
);

-- Enable RLS
ALTER TABLE public.syndic_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for syndic_subscriptions
CREATE POLICY "Syndics can view their own subscriptions"
ON public.syndic_subscriptions
FOR SELECT
USING (auth.uid() = syndic_user_id);

CREATE POLICY "Admins can manage all syndic subscriptions"
ON public.syndic_subscriptions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "System can insert syndic subscriptions"
ON public.syndic_subscriptions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update syndic subscriptions"
ON public.syndic_subscriptions
FOR UPDATE
USING (true);

-- Add syndic monthly price column to pricing_config
ALTER TABLE public.pricing_config 
ADD COLUMN IF NOT EXISTS syndic_monthly_price_per_residence NUMERIC DEFAULT 29.90;

-- Function to check if syndic has active subscription for a residence
CREATE OR REPLACE FUNCTION public.is_syndic_subscription_active(p_user_id UUID, p_residence_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.syndic_subscriptions 
    WHERE syndic_user_id = p_user_id 
    AND residence_id = p_residence_id 
    AND (
      (status = 'active' AND current_period_end > now())
      OR 
      (status = 'trial' AND trial_ends_at > now())
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updated_at
CREATE TRIGGER update_syndic_subscriptions_updated_at
BEFORE UPDATE ON public.syndic_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
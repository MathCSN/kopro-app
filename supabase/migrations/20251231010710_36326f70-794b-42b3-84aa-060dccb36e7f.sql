-- Create apartment_requests table for residents who need an apartment
CREATE TABLE public.apartment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  manager_response TEXT,
  assigned_lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID
);

-- Enable RLS
ALTER TABLE public.apartment_requests ENABLE ROW LEVEL SECURITY;

-- Users can view and create their own requests
CREATE POLICY "Users can view their own requests"
ON public.apartment_requests
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create requests"
ON public.apartment_requests
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Managers can view and manage requests for their residences
CREATE POLICY "Managers can view residence requests"
ON public.apartment_requests
FOR SELECT
USING (can_manage_rental(auth.uid(), residence_id));

CREATE POLICY "Managers can update residence requests"
ON public.apartment_requests
FOR UPDATE
USING (can_manage_rental(auth.uid(), residence_id));

-- Create trigger for updated_at
CREATE TRIGGER update_apartment_requests_updated_at
  BEFORE UPDATE ON public.apartment_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.apartment_requests;
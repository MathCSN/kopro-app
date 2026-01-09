-- Create ticket_comments table for ticket discussions
CREATE TABLE public.ticket_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Users can view comments on tickets they have access to (same residence)
CREATE POLICY "Users can view ticket comments"
ON public.ticket_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tickets t
    JOIN public.user_roles ur ON ur.residence_id = t.residence_id
    WHERE t.id = ticket_comments.ticket_id
    AND ur.user_id = auth.uid()
  )
  OR public.is_admin(auth.uid())
);

-- Users can create comments
CREATE POLICY "Users can create comments"
ON public.ticket_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON public.ticket_comments
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON public.ticket_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_ticket_comments_updated_at
  BEFORE UPDATE ON public.ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for ticket comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_comments;
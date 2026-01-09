-- Add new fields to posts table for enhanced messaging
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS event_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.posts(id) ON DELETE SET NULL;

-- Create index for reply lookups
CREATE INDEX IF NOT EXISTS idx_posts_reply_to ON public.posts(reply_to_id) WHERE reply_to_id IS NOT NULL;
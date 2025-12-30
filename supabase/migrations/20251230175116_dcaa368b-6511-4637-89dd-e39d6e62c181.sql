-- Create post_likes table
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create post_comments table
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_rsvps table for event posts
CREATE TABLE public.event_rsvps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Add event fields to posts table
ALTER TABLE public.posts 
ADD COLUMN event_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN event_location TEXT;

-- Enable RLS on all tables
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Policies for post_likes
CREATE POLICY "Users can view likes in their residence" 
ON public.post_likes FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.posts p 
  WHERE p.id = post_likes.post_id 
  AND has_residence_access(auth.uid(), p.residence_id)
));

CREATE POLICY "Users can like posts in their residence" 
ON public.post_likes FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.posts p 
    WHERE p.id = post_likes.post_id 
    AND has_residence_access(auth.uid(), p.residence_id)
  )
);

CREATE POLICY "Users can unlike their own likes" 
ON public.post_likes FOR DELETE 
USING (user_id = auth.uid());

-- Policies for post_comments
CREATE POLICY "Users can view comments in their residence" 
ON public.post_comments FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.posts p 
  WHERE p.id = post_comments.post_id 
  AND has_residence_access(auth.uid(), p.residence_id)
));

CREATE POLICY "Users can comment on posts in their residence" 
ON public.post_comments FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.posts p 
    WHERE p.id = post_comments.post_id 
    AND has_residence_access(auth.uid(), p.residence_id)
  )
);

CREATE POLICY "Users can edit their own comments" 
ON public.post_comments FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" 
ON public.post_comments FOR DELETE 
USING (user_id = auth.uid());

-- Policies for event_rsvps
CREATE POLICY "Users can view RSVPs in their residence" 
ON public.event_rsvps FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.posts p 
  WHERE p.id = event_rsvps.post_id 
  AND has_residence_access(auth.uid(), p.residence_id)
));

CREATE POLICY "Users can RSVP to events in their residence" 
ON public.event_rsvps FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.posts p 
    WHERE p.id = event_rsvps.post_id 
    AND has_residence_access(auth.uid(), p.residence_id)
  )
);

CREATE POLICY "Users can update their own RSVP" 
ON public.event_rsvps FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can cancel their RSVP" 
ON public.event_rsvps FOR DELETE 
USING (user_id = auth.uid());
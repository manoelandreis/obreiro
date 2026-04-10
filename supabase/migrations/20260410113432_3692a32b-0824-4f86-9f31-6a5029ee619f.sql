
-- Create quote_events table for behavior tracking
CREATE TABLE public.quote_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  step_number INTEGER,
  template_id UUID REFERENCES public.quote_templates(id),
  session_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add services_summary to quote_logs
ALTER TABLE public.quote_logs ADD COLUMN services_summary JSONB DEFAULT '[]';

-- Enable RLS on quote_events
ALTER TABLE public.quote_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (public tracking)
CREATE POLICY "Anyone can insert quote events"
ON public.quote_events
FOR INSERT
WITH CHECK (true);

-- Only admins can view events
CREATE POLICY "Admins can view quote events"
ON public.quote_events
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Index for performance
CREATE INDEX idx_quote_events_session ON public.quote_events(session_id);
CREATE INDEX idx_quote_events_type ON public.quote_events(event_type);
CREATE INDEX idx_quote_events_created ON public.quote_events(created_at);

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS meta_last_event_sent text,
ADD COLUMN IF NOT EXISTS meta_last_event_at timestamptz;
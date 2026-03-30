ALTER TABLE public.leads
  ADD COLUMN call_date timestamptz DEFAULT NULL,
  ADD COLUMN briefing_notes text DEFAULT NULL;
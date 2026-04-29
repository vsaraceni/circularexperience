ALTER TABLE public.lead_ingest_log
  DROP CONSTRAINT IF EXISTS lead_ingest_log_lead_id_fkey;

ALTER TABLE public.lead_ingest_log
  ADD CONSTRAINT lead_ingest_log_lead_id_fkey
  FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;
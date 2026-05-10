ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS form_id text,
  ADD COLUMN IF NOT EXISTS qualificador_tier1 text;

CREATE INDEX IF NOT EXISTS idx_leads_form_id ON public.leads (form_id);
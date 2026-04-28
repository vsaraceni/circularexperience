ALTER TABLE public.lead_sources
  ADD COLUMN IF NOT EXISTS produto_label text;

ALTER TABLE public.lead_sources
  ADD COLUMN IF NOT EXISTS previous_api_key_hash text,
  ADD COLUMN IF NOT EXISTS previous_api_key_prefix text,
  ADD COLUMN IF NOT EXISTS previous_api_key_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_lead_sources_previous_prefix
  ON public.lead_sources (previous_api_key_prefix)
  WHERE previous_api_key_prefix IS NOT NULL;
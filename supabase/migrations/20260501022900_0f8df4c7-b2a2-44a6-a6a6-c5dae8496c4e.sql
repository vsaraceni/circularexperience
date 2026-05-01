ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS suggested_tier integer,
  ADD COLUMN IF NOT EXISTS tier_reasoning text,
  ADD COLUMN IF NOT EXISTS tier_signals jsonb,
  ADD COLUMN IF NOT EXISTS tier_confirmed boolean NOT NULL DEFAULT false;
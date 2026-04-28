-- 1. Lead sources: WhatsApp config
ALTER TABLE public.lead_sources
  ADD COLUMN IF NOT EXISTS whatsapp_auto_send boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_channel_id text;

-- 2. WhatsApp send log
CREATE TABLE IF NOT EXISTS public.whatsapp_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid,
  source_slug text,
  phone text,
  status text NOT NULL CHECK (status IN ('sent','skipped_no_phone','skipped_duplicate','skipped_disabled','error')),
  gptmaker_response jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wa_log_lead_created ON public.whatsapp_send_log(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_log_created ON public.whatsapp_send_log(created_at DESC);

ALTER TABLE public.whatsapp_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wa_log_admin_select"
  ON public.whatsapp_send_log
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

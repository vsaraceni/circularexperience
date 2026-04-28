ALTER TABLE public.lead_sources
  ADD COLUMN IF NOT EXISTS whatsapp_agent_id text;

COMMENT ON COLUMN public.lead_sources.whatsapp_agent_id IS
  'ID do agente do GPT Maker que receberá o briefing do lead via add-message antes do start-conversation. Se vazio, usa GPTMAKER_AGENT_ID global.';
ALTER TABLE public.lead_sources ADD COLUMN IF NOT EXISTS whatsapp_triagem_agent_id text NULL;
COMMENT ON COLUMN public.lead_sources.whatsapp_triagem_agent_id IS 'Override do agente de triagem da GPT Maker para esta fonte. Normalmente vazio (usa o env GPTMAKER_TRIAGEM_AGENT_ID).';
COMMENT ON COLUMN public.lead_sources.whatsapp_agent_id IS 'Agente-alvo da transferência no GPT Maker (agente do produto que assume após a triagem).';
COMMENT ON COLUMN public.lead_sources.whatsapp_channel_id IS 'Override do canal WhatsApp (opcional). Quase sempre vazio — usa o env GPTMAKER_CHANNEL_ID.';
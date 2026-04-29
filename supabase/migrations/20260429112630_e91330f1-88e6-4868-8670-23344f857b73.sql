ALTER TABLE public.lead_sources
ADD COLUMN IF NOT EXISTS whatsapp_initial_message text;

COMMENT ON COLUMN public.lead_sources.whatsapp_initial_message IS
'Mensagem inicial enviada ao lead via WhatsApp. Suporta variáveis {{primeiro_nome}}, {{nome}}, {{produto}}, {{empresa}}, {{campanha}}. Se NULL, usa env GPTMAKER_INITIAL_MESSAGE ou fallback humano padrão.';
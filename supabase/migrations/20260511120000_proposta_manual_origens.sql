-- Adicionar campo origem_detalhe em leads para capturar contexto de origem manual
-- (ex: "Indicação Flávio Ribeiro", "Evento Circular Day 2026", "Outbound LinkedIn João Silva")
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS origem_detalhe text;

COMMENT ON COLUMN public.leads.origem_detalhe IS
  'Texto livre que detalha a origem do lead quando categoria genérica (manual_outbound, manual_indicacao, etc). Preenchido principalmente em propostas manuais.';

-- Inserir 4 lead_sources canônicos para propostas manuais
-- Não têm API key (api_key_hash/prefix vazios) porque não recebem POST externo.
-- Servem só pra categorizar a origem no momento de criar lead manualmente.
INSERT INTO public.lead_sources (slug, nome, api_key_hash, api_key_prefix, ativo, default_stage, rate_limit_per_min, cors_origins, email_notificar, capi_habilitado, custom_field_schema, whatsapp_auto_send)
VALUES
  ('manual_outbound', 'Manual — Outbound', '', '', true, 'proposta', 0, '{}', '{}', false, '{}'::jsonb, false),
  ('manual_inbound', 'Manual — Inbound orgânico', '', '', true, 'proposta', 0, '{}', '{}', false, '{}'::jsonb, false),
  ('manual_indicacao', 'Manual — Indicação', '', '', true, 'proposta', 0, '{}', '{}', false, '{}'::jsonb, false),
  ('manual_evento', 'Manual — Evento', '', '', true, 'proposta', 0, '{}', '{}', false, '{}'::jsonb, false)
ON CONFLICT (slug) DO NOTHING;

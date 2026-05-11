
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS origem_detalhe text;

INSERT INTO public.lead_sources (slug, nome, api_key_prefix, api_key_hash, ativo, whatsapp_auto_send, default_stage, notas)
VALUES
  ('outbound',          'Outbound',          'manual_outbound',   'disabled:manual', true, false, 'novo', 'Origem manual — não recebe webhooks.'),
  ('inbound-organico',  'Inbound orgânico',  'manual_inbound',    'disabled:manual', true, false, 'novo', 'Origem manual — não recebe webhooks.'),
  ('indicacao',         'Indicação',         'manual_indicacao',  'disabled:manual', true, false, 'novo', 'Origem manual — não recebe webhooks.'),
  ('evento',            'Evento',            'manual_evento',     'disabled:manual', true, false, 'novo', 'Origem manual — não recebe webhooks.')
ON CONFLICT (slug) DO NOTHING;

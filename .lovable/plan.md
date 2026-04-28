## Integração WhatsApp via GPT Maker — Plano final

Decisões fechadas:
- **Disparo:** automático ao entrar lead novo (configurável por fonte).
- **Idempotência:** bloqueia reenvio se já houve envio nas últimas 24h pro mesmo lead.
- **Mensagem:** GPT Maker gera — **não enviamos `message` no body**, só `phone`. O agente do GPT Maker assume a conversa.

> Nota técnica: a doc do Makerzinho mostra `message` como obrigatório, mas vamos confirmar via teste real se o endpoint aceita só `phone` (alguns endpoints do GPT Maker têm modo "iniciar atendimento sem mensagem prévia"). Se exigir, mandamos uma mensagem técnica mínima tipo `"."` ou um placeholder configurável por fonte. Isso fica como fallback no código, sem te incomodar.

---

## O que vai ser feito

### 1. Secrets (você precisa fornecer)
- `GPTMAKER_TOKEN` — token de autenticação da API.
- `GPTMAKER_CHANNEL_ID` — channelId do canal WhatsApp não oficial.

Vou pedir via `add_secret` no início da implementação.

### 2. Banco de dados
- Adicionar em `lead_sources`:
  - `whatsapp_auto_send` (boolean, default `false`) — liga/desliga por fonte.
  - `whatsapp_channel_id` (text, nullable) — override opcional do channelId padrão (caso futuro com múltiplos canais).
- Nova tabela `whatsapp_send_log`:
  - `id`, `lead_id`, `source_slug`, `phone`, `status` (`sent` | `skipped_no_phone` | `skipped_duplicate` | `error`), `gptmaker_response` (jsonb), `error` (text), `created_at`.
  - RLS: admin SELECT only, service role insert.

### 3. Edge Function nova: `send-whatsapp-gptmaker`
- `verify_jwt = false` (chamada por outra edge function via service role).
- Input: `{ lead_id }`.
- Lê o lead, valida e normaliza telefone pra E.164 sem `+` (ex: `5511999999999`).
- Verifica idempotência: existe `whatsapp_send_log` com `status='sent'` nas últimas 24h pro mesmo `lead_id`? Se sim, retorna `skipped_duplicate`.
- `POST https://api.gptmaker.ai/v2/channel/{channelId}/start-conversation` com Bearer token.
- Registra resultado em `whatsapp_send_log` e cria `lead_activities` (`activity_type: "whatsapp_iniciado"`).
- Marca `leads.whatsapp_sent = true` e atualiza `last_activity_at`.

### 4. Editar `ingest-lead`
- No fim do fluxo, se `source.whatsapp_auto_send = true`, dispara `send-whatsapp-gptmaker` via `EdgeRuntime.waitUntil` (não bloqueia resposta — mesmo padrão do CAPI e email interno).

### 5. Painel de Integrações (admin) — `/admin/integracoes`
Nova seção "WhatsApp (GPT Maker)" no topo da página, separada das fontes de lead:
- Status: token e channelId configurados? (verifica via edge function que retorna boolean, nunca expõe valores).
- Métrica simples: WhatsApps enviados / falhados nos últimos 7 dias (lendo `whatsapp_send_log`).
- Link "Ver últimos envios" → modal com lista (lead, status, hora, erro).

E no card de cada fonte (na lista existente), adicionar:
- Toggle "Disparar WhatsApp automático ao receber lead" (controla `whatsapp_auto_send`).

### 6. Normalização de telefone
- Reforçar regra E.164 BR no `_shared/normalize.ts`: aceita `(11) 99999-9999`, `+55 11...`, `5511...` → sempre devolve `5511999999999`. Rejeita se < 10 dígitos após DDI.

---

## Arquivos previstos

- `supabase/migrations/..._whatsapp_gptmaker.sql` (novo)
- `supabase/functions/send-whatsapp-gptmaker/index.ts` (novo)
- `supabase/functions/ingest-lead/index.ts` (editar — disparo condicional)
- `supabase/functions/_shared/normalize.ts` (editar — validador E.164 estrito)
- `supabase/config.toml` (editar — registrar nova função com `verify_jwt = false`)
- `src/pages/admin/Integrations.tsx` (editar — seção GPT Maker + toggle por fonte)
- `src/components/admin/integrations/IntegrationFormDialog.tsx` (editar — toggle whatsapp_auto_send)
- `src/components/admin/integrations/WhatsAppPanel.tsx` (novo — status + métricas + log)
- `src/hooks/useLeadSources.ts` (editar — incluir `whatsapp_auto_send`)
- `src/integrations/supabase/types.ts` (auto-regenerado)

---

## Fora do escopo (a fazer no futuro, se precisar)
- Botão de envio manual no Lead Drawer.
- Templates customizados (você confirmou que não precisa — GPT Maker resolve).
- Múltiplos canais por fonte.
- Webhook reverso recebendo mensagens do lead (entrada bidirecional).

Posso começar?

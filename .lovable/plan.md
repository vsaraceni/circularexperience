## Diagnóstico

**Root cause:** `supabase/functions/webhook-meta-leads/index.ts` insere o lead mas **nunca invoca** `send-whatsapp-gptmaker`. Só o `ingest-lead` (LP) chama. Por isso:

- `lead_sources.meta_ads.whatsapp_auto_send = true` ✅
- `whatsapp_send_log` com `source_slug='meta_ads'` → **0 registros**
- 323 leads `meta_ads` sem disparo
- `lp_ce` funciona normalmente

**Bug secundário:** webhook insere `origem: "Meta Lead Ads"` (linha 241), mas slug é `meta_ads`. Os dados atuais já estão como `meta_ads` (deploy anterior dessincronizado), porém um redeploy "as-is" quebraria também o lookup `WHERE slug = lead.origem` dentro do `send-whatsapp-gptmaker`.

## Mudanças

### 1. `supabase/functions/webhook-meta-leads/index.ts`
- Linha 241: `origem: "Meta Lead Ads"` → `origem: "meta_ads"`.
- Após insert + CAPI: invocar `send-whatsapp-gptmaker` via `EdgeRuntime.waitUntil(supabase.functions.invoke('send-whatsapp-gptmaker', { body: { lead_id } }).catch(...))` — condicionado a `lead_sources.meta_ads.whatsapp_auto_send=true` (busco a flag uma vez por batch).
- Console log para facilitar debug futuro.

### 2. Teste ponta a ponta
Lead mais recente: **Alessandra de Almeida Lucas** (`ffd1eef9-9d63-420e-bcee-7720bdb7657b`, `+5516981752085`, `whatsapp_sent=false`).

Após deploy do webhook, chamar `send-whatsapp-gptmaker` via `supabase--curl_edge_functions` com `{ lead_id: "ffd1eef9-..." }` e validar:
- Resposta `{ ok: true, status: "sent" }`
- Novo registro em `whatsapp_send_log` (`source_slug='meta_ads'`, `status='sent'`)
- `leads.whatsapp_sent = true`
- `lead_activities` com `whatsapp_iniciado`
- (Se possível) confirmação visual no GPT Maker

Se algum passo falhar, leio logs do edge function e ajusto.

### 3. Não vou alterar
- `send-whatsapp-gptmaker` (já provado funcionando para `lp_ce`)
- Painel admin `/admin/integracoes`
- RLS / schema

## Pergunta pós-teste
Após o teste passar, quer que eu **dispare WhatsApp para os outros leads Meta Ads recentes** sem disparo (últimas 24h ~5 leads), ou só ativa daqui em diante?

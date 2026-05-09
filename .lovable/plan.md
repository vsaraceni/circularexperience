## Diagnóstico definitivo

**Os leads Meta Ads NÃO estão entrando pela edge function `webhook-meta-leads`.**

Evidências:
- `function_edge_logs` (últimas horas): zero hits em `/functions/v1/webhook-meta-leads`. Só `check-notifications` e `send-push-notification`.
- `lead_ingest_log` últimas 24h: só `lp_ce`. Nada com `meta_ads`.
- Mesmo assim, leads `meta_ads` continuam pingando regularmente (Ultragaz 10:00, J&J 10:01, UFSCar 06:23…) com `fb_lead_id`, `ad_id`, `created_at` em padrão de polling (`segundos = :06`).

**Conclusão:** existe um worker externo (provável n8n/Zapier/script) que faz polling na Graph API e **insere direto na tabela `leads`** via PostgREST com service role — ignorando totalmente nossa edge function. Por isso o fix de invocar `send-whatsapp-gptmaker` dentro do `webhook-meta-leads` nunca dispara.

A regra "fonte com `whatsapp_auto_send=true` envia WhatsApp" precisa morar **no banco**, não em uma edge function específica, porque temos múltiplos caminhos de entrada (webhook-meta-leads, ingest-lead, e agora o externo).

## Solução: trigger no banco

Mover o disparo para um trigger `AFTER INSERT ON leads`, idêntico em padrão ao já existente `trigger_welcome_email`.

### 1. Nova função `trigger_whatsapp_gptmaker()` (SECURITY DEFINER)

Filtros (idênticos à lógica atual em `send-whatsapp-gptmaker`, evitando trabalho desnecessário):
- `NEW.whatsapp_sent IS DISTINCT FROM TRUE`
- `NEW.telefone` não vazio
- `NEW.email NOT ILIKE '%@atinaedu.com.br'` e `'%@movimentocircular.io'` (consistência com welcome)
- `NEW.kanban_stage = 'novo'` e `NEW.status NOT IN ('converted','archived')`
- `EXISTS (SELECT 1 FROM lead_sources WHERE slug = NEW.origem AND ativo AND whatsapp_auto_send)`

Se passar: `extensions.http` POST para `${SUPABASE_URL}/functions/v1/send-whatsapp-gptmaker` com `Authorization: Bearer <service_role>` (vault) e body `{ "lead_id": NEW.id }`. Erros vão para `RAISE LOG` (não bloqueiam o insert).

Idempotência continua sendo responsabilidade da edge function (já tem janela de 24h em `whatsapp_send_log`), então duplo disparo é seguro.

### 2. Trigger `tg_leads_whatsapp_auto`

```sql
CREATE TRIGGER tg_leads_whatsapp_auto
AFTER INSERT ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.trigger_whatsapp_gptmaker();
```

### 3. Limpeza no webhook

Remover o bloco `7b` (invoke `send-whatsapp-gptmaker`) de `supabase/functions/webhook-meta-leads/index.ts` — vira responsabilidade do trigger e evita risco de double-fire caso o webhook volte a ser usado. Manter o `origem: "meta_ads"` corrigido.

### 4. Backfill do lead Ultragaz

Já disparado manualmente nesta sessão (`whatsapp_sent=true`). Sem ação adicional.

## Teste ponta-a-ponta

1. Aguardar próximo lead `meta_ads` chegar pelo polling externo.
2. Conferir em `whatsapp_send_log` registro `source_slug='meta_ads'`, `status='sent'` em segundos após o insert.
3. Conferir `lead_activities` com `whatsapp_iniciado` e `leads.whatsapp_sent=true`.

Se houver impaciência, faço também um INSERT de teste controlado (lead descartável com `@example.com` fora dos filtros de teste) e reverto.

## Fora de escopo

- Investigar/conectar o worker externo: pode ficar para depois; o trigger neutraliza a dependência.
- `send-whatsapp-gptmaker` (já validado).
- UI/admin/RLS.

## Pergunta

Quer que eu **também ative essa rede de segurança via trigger para os leads `lp_ce`** (LP Circular Experience), substituindo o invoke que hoje vive no `ingest-lead`? Ou mantenho `lp_ce` no fluxo atual e o trigger só protege o caminho Meta? Recomendo unificar tudo no trigger por consistência, mas pergunto antes de mexer no que funciona.

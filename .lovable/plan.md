

## Conectar CRM ao Meta Ads — Edge Function `send-meta-capi-event`

### O que será feito

Uma edge function que envia eventos de conversão para o Meta (Facebook) Conversions API quando um lead avança para "Call Agendada" ou "Fechado", permitindo otimizar campanhas com base em dados reais do CRM.

### Migration necessária

Adicionar 2 colunas na tabela `leads`:
- `meta_last_event_sent` (text, nullable)
- `meta_last_event_at` (timestamptz, nullable)

### Edge Function: `supabase/functions/send-meta-capi-event/index.ts`

- CORS headers padrão
- Valida body (lead_id, email, stage obrigatórios)
- Filtra stages: só "Call Agendada" → `Schedule` (value 0) e "Fechado" → `Purchase` (value 14900)
- SHA-256 via `crypto.subtle.digest` nativo do Deno para email, work_email, telefone
- POST para `https://graph.facebook.com/v18.0/1614314956387976/events` com `META_ACCESS_TOKEN`
- PATCH na tabela `leads` via Supabase client (service role) para registrar `meta_last_event_sent` e `meta_last_event_at`
- Retorna `{ success: true, event_name }`

### Secret

`META_ACCESS_TOKEN` já existe nos secrets do projeto — não precisa adicionar.

### Integração no CRM

Chamar `supabase.functions.invoke("send-meta-capi-event", { body })` no momento em que o lead muda de stage no Kanban (dentro de `Dashboard.tsx` ou `KanbanBoard.tsx`, no handler de drag/drop ou mudança de coluna).

### Resumo de arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/send-meta-capi-event/index.ts` | Criar |
| Migration | Adicionar `meta_last_event_sent`, `meta_last_event_at` em `leads` |
| `src/pages/admin/Dashboard.tsx` ou `KanbanBoard.tsx` | Invocar a function ao mudar stage |



## Como funciona hoje

- O envio do welcome é **manual**: SDR clica "Enviar Boas-Vindas" no Kanban/Lista
- A função `send-welcome-email` envia usando como remetente os dados do **SDR logado** (`sender_name/email/phone`)
- No callback de sucesso, o front faz: `assigned_to = user.id` + `kanban_stage = 'boas_vindas'` → é isso que faz o SDR **assumir** o lead
- Existiu trigger `on_lead_insert` chamando essa função, mas **foi removido** (a função `trigger_welcome_email` ficou órfã no banco)
- Template `lead-welcome` em `email_templates` usa placeholders `{{sender_name}}`, `{{sender_email}}`, `{{sender_phone}}` no corpo, no `from_name` e no `cc`

## Solução: welcome 100% automático

### Remetente institucional padrão (não amarra a SDR)

- **From name:** `Lívia Lins · Movimento Circular`
- **From email:** `contato@lovable.movimentocircular.io` (domínio já verificado)
- **Reply-To:** `contato@movimentocircular.io`
- **Sem CC** (no fluxo automático)
- **Variáveis no corpo:**
  - `{{sender_name}}` → `Lívia Lins`
  - `{{sender_email}}` → `contato@movimentocircular.io`
  - `{{sender_phone}}` → `+55 11 98244-1551`

### Quando dispara

Trigger `AFTER INSERT` em `public.leads` chamando a edge function via `pg_net`. Só dispara se **todas** as condições baterem:

- `welcome_sent = false` (idempotente)
- email **não pertence** aos domínios de teste (`@atinaedu.com.br`, `@movimentocircular.io`)
- `kanban_stage = 'novo'` (não dispara para leads criados já em estágio avançado / propostas diretas)
- `status NOT IN ('converted', 'archived')`
- Email **não está em** `suppressed_emails`

### O que a edge function passa a fazer após envio bem-sucedido

1. `welcome_sent = true`, `welcome_sent_at = now()`
2. Move para `kanban_stage = 'boas_vindas'` (apenas se ainda em `novo`)
3. Atualiza `stage_updated_at` e `last_activity_at`
4. **NÃO atribui o lead** (`assigned_to` continua `NULL`) → regra existente de auto-assign na primeira ação real do SDR continua valendo
5. Insere `lead_activities` com `activity_type = 'welcome_enviado'`, `user_id = NULL`, conteúdo "E-mail de boas-vindas enviado automaticamente"

### Fluxo manual continua existindo (fallback)

O botão "Enviar Boas-Vindas" no Kanban/Lista vira fallback de reenvio:

- Quando clicado manualmente, **mantém a regra atual** de assumir o lead (`assigned_to = user.id`) — agora é ação intencional do SDR, e não o disparo padrão
- Para a maioria dos leads o botão já vai aparecer como "Enviado ✓" porque o automático rodou no insert

## Mudanças técnicas

1. **Migration**
   - Recriar `trigger_welcome_email()` com todos os filtros acima (welcome_sent, domínios de teste, stage `novo`, status, supressão), **sem** passar `sender_*` no payload
   - Criar trigger `on_lead_insert_welcome AFTER INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION trigger_welcome_email()`

2. **Edge function `send-welcome-email`**
   - Quando `sender_*` vier vazio (caso automático), aplicar defaults: `Lívia Lins` / `contato@movimentocircular.io` / `+55 11 98244-1551`
   - Após envio com sucesso, além do `welcome_sent`, atualizar `kanban_stage`, `stage_updated_at`, `last_activity_at` (somente se ainda em `novo`)
   - Inserir `lead_activities` com `user_id = NULL`
   - Pular CC quando não houver `sender_email` no payload
   - Manter guarda de idempotência

3. **Frontend** — sem mudanças. O botão segue funcionando como reenvio manual.

## Memória a atualizar após implementação

Adicionar nota em `mem://crm/automation-rules-and-logic`:
> Welcome automático no INSERT de leads via trigger `on_lead_insert_welcome`. Remetente padrão Lívia Lins (`contato@movimentocircular.io`, +55 11 98244-1551). Não atribui lead. Filtros: welcome_sent=false, stage=novo, status ativo, sem supressão, sem domínios de teste. Botão manual permanece como fallback e mantém regra de assumir o lead.

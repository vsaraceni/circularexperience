

## Notificações Robustas — In-App (sino + som + toast) + Email

### Estado atual

- **Sino in-app**: Existe (`NotificationBell`), com realtime via Supabase channel. Funciona, mas sem som e sem toast automático.
- **Edge Function `check-notifications`**: Roda sob demanda (não agendada via cron). Cobre follow-ups vencidos e propostas expirando. **Não cobre** novo lead nem mudança de estágio.
- **Email**: `send-lead-email` já envia email interno para `contato@movimentocircular.io` quando chega lead novo, mas não notifica cada vendedor individualmente.
- **Realtime**: O hook `useNotifications` já escuta INSERTs na tabela `notifications` — qualquer insert no banco gera refresh automático no sino.

### O que falta

1. **Novos eventos**: novo lead + lead avançou para proposta + quebra de SLA
2. **Som de alerta** ao receber notificação (desktop e mobile)
3. **Toast automático** via realtime (notificação visual instantânea)
4. **Badge no título da aba** (ex: `(3) Pipeline Comercial`)
5. **Email por evento** para o vendedor responsável (usando Resend já configurado)
6. **Agendar `check-notifications` via pg_cron** (hoje não roda automaticamente)

---

### 1. Novos tipos de notificação na Edge Function `check-notifications`

Adicionar ao `check-notifications/index.ts`:

**a) Novo lead sem ação (> 30min)**
- Query: leads com `kanban_stage = 'novo'` e `created_at < now() - 30min` sem notificação `new_lead` hoje
- Notifica todos os admins (query `user_roles` para role = admin)

**b) Lead avançou para Proposta**
- Usar um **database trigger** na tabela `leads`: quando `kanban_stage` muda para `'proposta'`, inserir notificação + disparar email
- Trigger chama uma nova Edge Function `notify-stage-change`

**c) Quebra de SLA**
- Adicionar ao `check-notifications`: para cada estágio com SLA, verificar leads que ultrapassaram o limite crítico
- Notifica o `assigned_to` do lead

### 2. Trigger para mudança de estágio (realtime imediato)

Criar um **database trigger** `on_lead_stage_change` que dispara quando `kanban_stage` muda para `proposta`:

```sql
CREATE OR REPLACE FUNCTION notify_stage_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.kanban_stage = 'proposta' AND OLD.kanban_stage != 'proposta' THEN
    INSERT INTO notifications (user_id, type, title, body, lead_id)
    SELECT ur.user_id, 'stage_proposal',
           'Lead avançou para Proposta: ' || COALESCE(NEW.company, NEW.name),
           'Preparar proposta comercial',
           NEW.id
    FROM user_roles ur WHERE ur.role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Isso garante notificação **instantânea** via realtime (o INSERT no `notifications` já é capturado pelo channel existente).

### 3. Trigger para novo lead

Trigger `on_new_lead_inserted` que insere notificação para todos os admins:

```sql
-- Na inserção de lead, notificar admins
INSERT INTO notifications (user_id, type, title, body, lead_id)
SELECT ur.user_id, 'new_lead',
       'Novo lead: ' || NEW.company || ' — ' || NEW.name,
       COALESCE(NEW.cargo, '') || ' | ' || NEW.email,
       NEW.id
FROM user_roles ur WHERE ur.role = 'admin';
```

### 4. Som + Toast automático no frontend

**Arquivo**: `src/hooks/useNotifications.ts`

No callback do realtime INSERT:
- Tocar um som curto (`/notification.mp3` — arquivo de ~2KB a incluir em `/public`)
- Disparar `toast()` do Sonner com título e corpo da notificação
- Vibrar no mobile (`navigator.vibrate(200)`)

**Arquivo**: `src/components/admin/NotificationBell.tsx`
- Adicionar ícones para os novos tipos: `new_lead: "🆕"`, `stage_proposal: "📊"`, `sla_breach: "🔴"`

### 5. Badge no título da aba

**Arquivo**: `src/hooks/useNotifications.ts`

Adicionar `useEffect` que atualiza `document.title`:
```
unread > 0 ? `(${unread}) Pipeline Comercial` : 'Pipeline Comercial'
```

### 6. Email para o vendedor responsável

**Arquivo**: `supabase/functions/check-notifications/index.ts`

Após inserir notificações, para cada notificação com `assigned_to`, enviar email via Resend:
- Assunto: título da notificação
- Body: HTML simples com link para o CRM
- Usar o email do perfil do vendedor (query `profiles.email`)
- Rate limit: max 1 email por tipo/lead/dia (já coberto pela lógica de dedup existente)

Para os triggers (new_lead, stage_proposal), o email será disparado pela Edge Function `notify-stage-change` chamada via `http_post` no trigger.

### 7. Agendar `check-notifications` via pg_cron

Usar `supabase insert tool` para criar cron job que roda a cada 15 minutos:

```sql
SELECT cron.schedule(
  'check-notifications-job',
  '*/15 * * * *',
  $$ SELECT net.http_post(...) $$
);
```

---

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| Migração SQL | Triggers `on_new_lead` e `on_lead_stage_change` + função `notify_stage_change` |
| `check-notifications/index.ts` | Adicionar SLA breach check + envio de email via Resend |
| `useNotifications.ts` | Som, toast automático, badge no título da aba |
| `NotificationBell.tsx` | Ícones para novos tipos |
| `/public/notification.mp3` | Arquivo de som (~2KB) |
| pg_cron (via insert tool) | Agendar check-notifications a cada 15min |

### Resultado

- **Novo lead chega** → trigger insere notificação → realtime dispara som + toast + email para admins
- **Lead avança para Proposta** → trigger → som + toast + email
- **SLA breach** → cron a cada 15min → notificação + email
- **Follow-up vencido** → cron → notificação + email
- **Proposta expirando** → cron → notificação + email
- **Mobile**: toast visível, vibração, badge no título


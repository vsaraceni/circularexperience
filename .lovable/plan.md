

## Follow-ups, Filtro "Precisam de Atenção" e Notificações

### Fase 1 — Follow-ups (Prioridade 1)

**Banco de dados**

Nova tabela `lead_follow_ups`:
- `id` uuid PK
- `lead_id` uuid NOT NULL
- `created_by` uuid NOT NULL
- `due_date` date NOT NULL
- `note` text
- `completed` boolean DEFAULT false
- `completed_at` timestamptz
- `created_at` timestamptz DEFAULT now()

RLS: admins gerenciam tudo.

**Drawer — nova aba "Follow-ups"**

Adicionar terceira aba no `TabsList` do drawer (ao lado de "Resumo" e "Histórico"):
- Form inline: data (date picker) + nota (input) + botão "Agendar"
- Lista de follow-ups pendentes (ordenados por `due_date` ASC), com botão "Concluir"
- Lista colapsável de concluídos
- Badge com contagem de pendentes no tab trigger

**LeadCard — indicador visual**

- Se o lead tem follow-up com `due_date = hoje` e `completed = false`, mostrar ícone 📅 com tooltip "Follow-up hoje"
- Se `due_date < hoje` e não concluído, mostrar em vermelho "Follow-up atrasado"

**Hook `useFollowUps.ts`**

- `useLeadFollowUps(leadId)` — query dos follow-ups do lead
- `useCreateFollowUp()` — mutation insert
- `useCompleteFollowUp()` — mutation update completed/completed_at
- Registrar atividade `follow_up_agendado` e `follow_up_concluido` em `lead_activities`

---

### Fase 2 — Filtro "Precisam de Atenção" (Prioridade 2)

**Proposals.tsx — botão no header**

Novo toggle/botão "⚠ Atenção" ao lado dos filtros existentes. Quando ativo, filtra leads que atendem **qualquer** critério:
- SLA em nível `critical` (já calculado por `getUrgencyLevel`)
- Follow-up atrasado (`due_date < hoje` e `completed = false`)
- Proposta expirando (`valid_until` dentro de 3 dias)

Lógica client-side — carrega follow-ups de todos os leads em batch para avaliar.

---

### Fase 3 — Notificações In-App (Prioridade 3)

**Banco de dados**

Nova tabela `notifications`:
- `id` uuid PK
- `user_id` uuid NOT NULL
- `type` text (follow_up_due, sla_breach, proposal_expiring)
- `title` text
- `body` text
- `lead_id` uuid
- `read` boolean DEFAULT false
- `created_at` timestamptz DEFAULT now()

RLS: usuário lê/atualiza as próprias.

**UI — Sino no header do CRM**

- Ícone Bell no header de `Proposals.tsx`, com badge de contagem de não-lidas
- Dropdown (Popover) com lista das últimas 20 notificações
- Click marca como lida e abre o drawer do lead

**Geração de notificações**

Edge function `check-notifications` rodando via `pg_cron` (1x por hora):
- Follow-ups vencendo hoje → notifica `assigned_to`
- Leads com SLA crítico há >1h sem notificação → notifica `assigned_to`
- Propostas expirando em 3 dias → notifica `created_by`

---

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| **Migration** | Criar `lead_follow_ups` e `notifications` |
| `useFollowUps.ts` (novo) | Hook CRUD follow-ups |
| `LeadDrawer.tsx` | Nova aba "Follow-ups" |
| `LeadCard.tsx` | Badge follow-up hoje/atrasado |
| `Proposals.tsx` | Filtro "Atenção", sino de notificações |
| `useNotifications.ts` (novo) | Hook leitura/mark-read |
| `NotificationBell.tsx` (novo) | Componente sino + dropdown |
| `check-notifications/index.ts` (novo) | Edge function cron |

### Estratégia de entrega

Implementar na sequência: Fase 1 → Fase 2 → Fase 3, cada uma funcional independentemente.


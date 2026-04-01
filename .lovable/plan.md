

## Correção SLA + Missões compactas — Plano

### Problema 1: SLA não reseta com follow-up

**Causa raiz**: O SLA calcula tempo desde `last_activity_at`. Quando Lívia agenda um follow-up, `last_activity_at` é atualizado, mas após 6h o relógio estoura novamente — mesmo com follow-up ativo agendado para hoje. **Um lead com follow-up pendente e não-atrasado deveria estar "em dia".**

**Correção**: Passar os dados de follow-ups para `getUrgencyLevel` e isentar o lead do SLA quando houver follow-up pendente com `due_date >= hoje`.

| Arquivo | Mudança |
|---------|---------|
| `UrgencyBadge.tsx` | `getUrgencyLevel` recebe parâmetro opcional `hasPendingFollowUp: boolean`. Se `true`, retorna `"normal"`. Mesma lógica em `formatElapsed` — mostra "✅ FU" em vez do timer |
| `KanbanBoard.tsx` | Ao chamar sort por urgência, passar `followUpsByLead` para `getUrgencyLevel` |
| `LeadCard.tsx` | Passar `hasPendingFollowUp` ao `<UrgencyBadge>` baseado em `followUpStatus` (já existe no props) |
| `KanbanColumn.tsx` | Repassar `followUpsByLead` para o cálculo de contagem de "atrasados" no header |
| `MissionsBanner.tsx` | Na missão "Follow-up pendente" (boas_vindas), excluir leads que têm follow-up ativo não-atrasado |
| `check-notifications/index.ts` | Na verificação de SLA breach, ignorar leads com follow-up pendente não-atrasado (query `lead_follow_ups` onde `completed = false AND due_date >= today`) |

**Lógica detalhada**:
- "Follow-up pendente não-atrasado" = `completed = false` E `due_date >= hoje`
- O `followUpsByLead` no KanbanBoard já tem `hasToday` — expandir para incluir `hasFuture: boolean` (due_date > today)
- `hasPendingFollowUp = hasToday || hasFuture` (qualquer follow-up não-atrasado)

### Problema 2: MissionsBanner — layout compacto em linha única

**Antes**: Título numa linha, cards em outra, barra de progresso embaixo = 3 linhas visuais.

**Depois**: Tudo numa única faixa horizontal:

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ 🎯 Missões do Dia  │ ✅ Leads novos │ ⚠️ 2 Follow-up │ ✅ Agend. │ 📅 1 Call │ 3/5  │
│ ████████████░░░░░ (barra fina integrada na parte inferior)                       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

| Mudança | Detalhe |
|---------|---------|
| Layout | `flex items-center` numa única linha, sem `flex-wrap`. Missões como chips inline compactos (`px-2 py-0.5 text-[11px]`) |
| Título | "Missões do Dia" com ícone 🎯, `text-[12px] font-semibold`, sem quebra |
| Chips de missão | Cada missão: `{icon} {count} {label-curto}` em badge inline. Labels abreviados: "Novos", "FU", "Agend.", "Calls", "Brief." |
| Resolução | Chip resolvido: ✅ opaco com risco sutil. Não-resolvido: cor de destaque |
| Contador | `3/5` ao final, discreto |
| Barra de progresso | `h-[2px]` na parte inferior do container, quase imperceptível |
| "Ver time" | Mantém o botão, posicionado no final da linha |
| Padding | `p-2 mb-3` (reduzido de `p-3 mb-4`) |
| "Pipeline em dia" | Quando tudo resolvido, substitui chips por badge único verde |

**Arquivo**: `MissionsBanner.tsx`

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `UrgencyBadge.tsx` | Adicionar param `hasPendingFollowUp` a `getUrgencyLevel` e `formatElapsed` |
| `LeadCard.tsx` | Computar e passar `hasPendingFollowUp` ao UrgencyBadge |
| `KanbanBoard.tsx` | Expandir `followUpsByLead` para incluir `hasFuture`, passar ao sort |
| `KanbanColumn.tsx` | Usar follow-up data na contagem de atrasados |
| `MissionsBanner.tsx` | Layout compacto single-line + considerar follow-ups na missão BV |
| `check-notifications/index.ts` | Ignorar leads com follow-up ativo no SLA breach |


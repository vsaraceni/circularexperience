

## Corrigir KPI "Em Contato" — incluir leads perdidos que passaram de boas-vindas

### Problema raiz

Quando um lead é marcado como "perdido", o `kanban_stage` vira `"perdido"` e perdemos o registro de qual estágio ele estava antes. Resultado: leads que estavam em `em_contato` e foram perdidos não contam no KPI "Em Contato", gerando números inconsistentes entre KPI e funil.

O que o usuário quer medir: **quantos leads "fisgamos" após boas-vindas** — incluindo os que depois foram perdidos.

### Solução

**1. Novo campo `lost_at_stage` na tabela `leads`** (migração SQL)

```sql
ALTER TABLE leads ADD COLUMN lost_at_stage text;
```

Backfill dos leads já perdidos usando `lead_activities`:
```sql
UPDATE leads SET lost_at_stage = sub.prev_stage
FROM (
  SELECT la.lead_id,
    (SELECT la2.content FROM lead_activities la2 
     WHERE la2.lead_id = la.lead_id AND la2.activity_type = 'stage_change' 
     AND la2.created_at < la.created_at 
     ORDER BY la2.created_at DESC LIMIT 1) as prev_stage
  FROM lead_activities la
  WHERE la.activity_type = 'perdido'
) sub
WHERE leads.id = sub.lead_id AND leads.kanban_stage = 'perdido' AND leads.lost_at_stage IS NULL;
```

Se não houver `stage_change` no histórico, fallback: marcar como `boas_vindas` (estágio mínimo para perda).

**2. Salvar `lost_at_stage` ao marcar como perdido** (`KanbanBoard.tsx`)

Na função `handleLostConfirm`, adicionar `lost_at_stage: lostLead.kanban_stage` no update.

**3. Refatorar KPIs e Funil** (`useStrategicDashboard.ts`)

Helper unificado para determinar o "estágio máximo alcançado" por um lead:

```typescript
function maxReachedStage(lead): string {
  if (lead.kanban_stage === "perdido") return lead.lost_at_stage || "boas_vindas";
  return lead.kanban_stage;
}
```

Todos os cálculos (KPI summary + funnel) usam `maxReachedStage` ao invés de `kanban_stage` direto:

| KPI | Numerador | Denominador |
|-----|-----------|-------------|
| Em Contato | leads cujo maxReached ≥ em_contato | total leads campanha |
| Agendamentos | leads cujo maxReached ≥ call_agendada | leads cujo maxReached ≥ em_contato |
| Propostas | leads cujo maxReached ≥ proposta | leads cujo maxReached ≥ call_agendada |

O funil também usa `maxReachedStage`, eliminando o filtro `status !== "lost"`. Perdidos são incluídos no universo e contam na fase que alcançaram.

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| Migração SQL | Adicionar coluna `lost_at_stage`, backfill existentes |
| `src/components/admin/KanbanBoard.tsx` | Salvar `lost_at_stage` ao marcar perdido |
| `src/hooks/useStrategicDashboard.ts` | Helper `maxReachedStage`, refatorar KPIs e funil para usar mesma lógica |
| `src/integrations/supabase/types.ts` | Auto-atualizado |


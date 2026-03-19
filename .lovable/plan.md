

## Plano: Renomear "Data do Evento" → "Data da Proposta" e preencher com hoje

**Arquivo:** `src/components/admin/ProposalForm.tsx`

### Alterações

1. Renomear o label "Data do Evento" para "Data da Proposta"
2. Inicializar `event_date` com a data de hoje (`new Date().toISOString().split("T")[0]`) quando não houver valor existente (proposta nova)

Impacto mínimo — 2 linhas alteradas no mesmo arquivo.


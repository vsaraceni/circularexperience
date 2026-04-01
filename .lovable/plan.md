

## Briefing acessível em todas as etapas do funil

### Problema

O bloco de Briefing no `LeadDrawer` está restrito ao estágio `call_agendada` (linha 353: `lead.kanban_stage === "call_agendada"`). Ele deveria estar visível em todas as etapas ativas, pois serve tanto para preparação de call quanto para elaboração de proposta.

### Correção

**Arquivo**: `src/components/admin/LeadDrawer.tsx`

1. **Remover a condição de estágio** — tirar o `{lead.kanban_stage === "call_agendada" && (...)}` que envolve o AccordionItem de Briefing (linha 353)
2. **Mostrar para todos os estágios ativos** — exibir o bloco quando `kanban_stage` não for `"perdido"` nem `"fechado"` (estágios terminais não precisam de edição)
3. **Badge "Pendente"** — manter apenas nos estágios `call_agendada` e `proposta`, onde o preenchimento é mais crítico

**Arquivo**: `src/components/admin/MissionsBanner.tsx`

4. **Missão "Brief."** — expandir para incluir leads em `proposta` sem briefing preenchido (além de `call_agendada`), já que agora é relevante para ambas as etapas

### Impacto

| Arquivo | Mudança |
|---------|---------|
| `LeadDrawer.tsx` | Remover gate de estágio no Briefing, ajustar badge |
| `MissionsBanner.tsx` | Expandir filtro de briefings incompletos para incluir `proposta` |


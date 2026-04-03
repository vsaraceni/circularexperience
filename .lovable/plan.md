

## Ajustes no Painel: Remover Pipeline + Corrigir KPI "Em Contato"

### Problema 1 — "Linha" Pipeline
A seção "Pipeline" com os 7 cards de estágio (Novo, Boas-Vindas, etc.) será removida do painel.

### Problema 2 — KPI "Em Contato" inconsistente com Funil
A discrepância (61% vs 71%) ocorre porque:
- **KPI** filtra leads pelo período da campanha (`created_at` entre datas)
- **Funil** usa TODOS os leads ativos (sem filtro de campanha)

Bases diferentes = números diferentes. A correção: **o funil também deve usar os leads filtrados pela campanha ativa**, garantindo que KPI e funil falem do mesmo universo de dados.

### Mudanças

**`src/pages/admin/StrategicDashboard.tsx`**
- Remover toda a seção "Pipeline" (linhas ~131-185 com `STAGES_META`, grid de cards, health bars)
- Remover o array `STAGES_META` no topo (não mais necessário)

**`src/hooks/useStrategicDashboard.ts`**
- Alterar o cálculo do `funnelData` para usar `campaignLeads` (quando campanha ativa) ao invés de `activeLeads + lostLeads`
- Isso alinha o denominador do funil com os KPIs da campanha

### Resultado esperado
- KPI "Em Contato" e Funil "Em Contato" mostrarão a mesma base de cálculo
- Seção Pipeline removida — espaço mais limpo para os dados relevantes

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `src/pages/admin/StrategicDashboard.tsx` | Remover seção Pipeline e `STAGES_META` |
| `src/hooks/useStrategicDashboard.ts` | Funil usa `campaignLeads` ao invés de todos os leads |


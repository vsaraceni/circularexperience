

## Excluir Leads de Teste das Estatísticas

### Problema
Leads com emails `@atinaedu.com.br` e `@movimentocircular.io` são de teste e distorcem todas as métricas.

### Solução
Filtrar esses leads logo após o fetch, antes de qualquer cálculo. Dois arquivos afetados:

**1. `src/hooks/useStrategicDashboard.ts`** (Painel Estratégico)
- Adicionar constante `TEST_DOMAINS` e helper `isTestEmail`
- Filtrar no `fetchAll` ao setar leads: `leadsRes.data.filter(l => !isTestEmail(l.email))`

**2. `src/pages/admin/Dashboard.tsx`** (Dashboard analítico)
- Mesma lógica: filtrar leads de teste ao setar o estado após o fetch
- Isso propaga automaticamente para todos os cálculos derivados (activeLeads, lostLeads, funil, etc.)

### Constante compartilhada
Reutilizar o padrão já existente em `LostLeadsView.tsx`:
```typescript
const TEST_DOMAINS = ["@atinaedu.com.br", "@movimentocircular.io"];
const isTestEmail = (email: string) =>
  TEST_DOMAINS.some((d) => email.toLowerCase().endsWith(d));
```

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `src/hooks/useStrategicDashboard.ts` | Filtrar leads de teste no fetch |
| `src/pages/admin/Dashboard.tsx` | Filtrar leads de teste no fetch |


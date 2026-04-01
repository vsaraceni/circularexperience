

## Diagnóstico: SLA nunca reseta — leads ficam "atrasados" para sempre

### Causa raiz

O bug está na função `getUrgencyLevel` em `UrgencyBadge.tsx` (linha 25):

```ts
const refDate = stage === "nutricao" ? (lastActivityAt || stageUpdatedAt) : stageUpdatedAt;
```

**Apenas o estágio "nutrição" usa `last_activity_at` como referência.** Todos os outros estágios usam `stage_updated_at`, que só muda quando o lead **troca de estágio**.

Quando Lívia agenda um follow-up, o hook `useCreateFollowUp` atualiza `last_activity_at` no banco — mas o SLA ignora esse campo. O relógio do SLA continua contando desde que o lead entrou no estágio, independente de qualquer ação feita.

**Resultado**: lead com 6 dias em "Boas-Vindas" mostra 🔴 6d mesmo após 10 follow-ups agendados. As missões herdam o mesmo cálculo, então também nunca resolvem.

### Correção

**Arquivo**: `src/components/admin/UrgencyBadge.tsx`

Mudar a lógica de `refDate` para usar `lastActivityAt || stageUpdatedAt` em **todos** os estágios, não apenas "nutrição":

```ts
// ANTES (linha 25):
const refDate = stage === "nutricao" ? (lastActivityAt || stageUpdatedAt) : stageUpdatedAt;

// DEPOIS:
const refDate = lastActivityAt || stageUpdatedAt;
```

Aplicar a mesma mudança na função `formatElapsed` (linha 48), que tem a mesma lógica duplicada.

### Por que isso é seguro

- `last_activity_at` já é atualizado em **todas as ações** relevantes: follow-up agendado/concluído, nota adicionada, stage movido, proposta enviada, contato registrado, etc.
- Quando o lead muda de estágio, `handleDragEnd` já atualiza `last_activity_at = now` junto com `stage_updated_at = now`, então o relógio reinicia naturalmente.
- Se um lead nunca teve atividade (`last_activity_at` é null), o fallback para `stageUpdatedAt` mantém o comportamento atual.

### Efeito cascata (auto-resolvido)

| Componente | Status |
|-----------|--------|
| `UrgencyBadge` (cards) | ✅ Corrigido — reseta com qualquer ação |
| `KanbanColumn` (contagem "atrasados") | ✅ Corrigido — usa `getUrgencyLevel` |
| `MissionsBanner` ("Follow-up pendente") | ✅ Corrigido — usa `getUrgencyLevel` |
| `KanbanBoard` (ordenação por urgência) | ✅ Corrigido — usa `getUrgencyLevel` |
| `check-notifications` (SLA breach) | ⚠️ Edge function tem sua própria lógica SQL — revisar se usa a mesma referência |

### Verificação adicional: Edge Function

**Arquivo**: `supabase/functions/check-notifications/index.ts`

Verificar se a query de SLA breach no cron usa `stage_updated_at` ou `last_activity_at`. Se usar apenas `stage_updated_at`, alinhar com a mesma lógica (usar `COALESCE(last_activity_at, stage_updated_at)`).

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `UrgencyBadge.tsx` | 2 linhas: `refDate` em `getUrgencyLevel` e `formatElapsed` |
| `check-notifications/index.ts` | Alinhar query SQL de SLA com `COALESCE(last_activity_at, stage_updated_at)` |


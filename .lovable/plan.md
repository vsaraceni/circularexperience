

## Filtros e Ordenamento do CRM — Correção e Evolução

### Problemas atuais

1. **Ordenação quebrada**: O KanbanBoard tem toggle "Chegada / Parados" que ordena os leads, mas o KanbanColumn sempre re-ordena por urgência (`sortByUrgency`), ignorando a escolha do usuário.
2. **Faltam filtros temporais e de urgência**.

### Mudanças

#### 1. `KanbanColumn.tsx` — Respeitar a ordenação do board

Remover a função `sortByUrgency` e o re-sort interno. A coluna deve renderizar os leads na ordem que recebe do board. A ordenação por urgência será uma das opções no board.

#### 2. `KanbanBoard.tsx` — Corrigir sort + adicionar 3 modos

Substituir o toggle atual (arrival/stale) por 3 opções de ordenação:
- **Urgência** (padrão): críticos primeiro, depois atenção, depois normal. Dentro de cada grupo, mais antigo primeiro. (Comportamento que já existe na coluna, movido para cá.)
- **Chegada**: mais recente primeiro (`created_at` desc)
- **Parados**: menos atividade recente primeiro (`last_activity_at` asc)

#### 3. `Proposals.tsx` — Novos filtros

Adicionar dois novos filtros na barra existente (ao lado de Origem e Responsável):

- **Período**: Select com opções "Todos", "Últimos 7 dias", "Últimos 30 dias", "Últimos 90 dias". Filtra por `created_at` do lead.
- **Vencidos**: Botão toggle (estilo chip/badge) "Vencidos" que, quando ativo, mostra apenas leads com urgency level `critical`. Usa a função `getUrgencyLevel` já exportada do `UrgencyBadge.tsx`.

Atualizar o `filteredLeads` useMemo para aplicar esses dois filtros adicionais.

#### 4. Filtro "Sem responsável"

Adicionar opção "Sem responsável" no select de Responsável existente (valor especial `unassigned`), filtrando `assigned_to === null`.

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `KanbanColumn.tsx` | Remover `sortByUrgency`, renderizar na ordem recebida |
| `KanbanBoard.tsx` | 3 modos de sort (urgência/chegada/parados), aplicar sort centralizado |
| `Proposals.tsx` | Filtros de período e vencidos, opção "Sem responsável" |




## Melhorias na To-Do List + Cópia WhatsApp no Card

### 1. Nova coluna "Follow-up" — último FUp registrado

Adicionar uma nova coluna na tabela mostrando o follow-up **mais recente** de cada lead (pendente ou concluído), com data agendada e nota. Diferente da coluna "Próx. Ação" que mostra apenas o próximo pendente.

- Buscar todos os follow-ups (não só pendentes) via query adicional a `lead_follow_ups` ordenado por `created_at desc`
- Montar `latestFollowUpMap`: `lead_id → { note, due_date, completed, created_at }`
- Exibir na célula: data + nota truncada; se concluído, texto riscado ou com ✅
- Filtro: "📋 Com FUp" / "📭 Sem FUp"
- Adicionar à lista de colunas e ao `DEFAULT_COL_WIDTHS`

### 2. Corrigir dimensionamento de colunas (resize)

O `ResizeHandle` atual tem um bug: usa `DEFAULT_COL_WIDTHS[i] + delta` em vez de acumular a partir da largura atual. Cada drag recalcula sobre o valor original.

- Corrigir para usar `baseWidthsRef` corretamente: capturar o width atual no `mousedown` e somar o delta sobre ele

### 3. Highlight na linha ao hover

A classe `hover:bg-muted/50` já existe no `<tr>`. Vou reforçar com uma cor mais visível para tornar o efeito perceptível.

### 4. Copiar "telefone, nome, empresa" no WhatsApp (Card do Kanban)

No `KanbanBoard.tsx`, alterar o case `copy_whatsapp` para copiar o formato:
```
telefone, nome, empresa
```
em vez de apenas o telefone.

### Arquivos impactados

| Arquivo | Mudança |
|---|---|
| `src/components/admin/PriorityListView.tsx` | Nova coluna "Follow-up", corrigir resize, melhorar hover, ajustar `DEFAULT_COL_WIDTHS` |
| `src/components/admin/KanbanBoard.tsx` | `copy_whatsapp` → copiar "telefone, nome, empresa" |

Nenhuma migração necessária.


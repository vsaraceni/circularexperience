

## Melhorias na To-Do List: Remover Follow-up, Reformatar Próx. Ação, Reordenar Colunas

### 1. Deletar coluna "Follow-up"

- Remover do array `columns` (índice 11)
- Remover `DEFAULT_COL_WIDTHS[11]`
- Remover `filterFollowUp` state, `followUpFilterOptions`, referências no `filteredRows` e barra de filtros
- Remover `latestFollowUpMap`, `allFollowUps` state e fetch de `lead_follow_ups`
- Remover sort case `"follow_up"` e do tipo `SortCol`
- Remover célula `<td>` do Follow-up no render
- Ajustar `colSpan` do empty state

### 2. Coluna "Próx. Ação" — layout em duas linhas

Reformatar a célula (linhas 673-697) para:

```text
Ligar para confirmar     ← nota (linha 1, texto principal)
14/04                    ← data (linha 2, menor, com cor por status)
```

- Linha 1: nota do follow-up (truncada, cor normal)
- Linha 2: data formatada, colorida (vermelho=vencido, laranja=hoje, cinza=futuro)
- Sem follow-up: manter ⚠️ como está

### 3. Drag-and-drop para reordenar colunas (persistente)

Implementar reordenação de colunas via HTML5 drag & drop nos `<th>`:

- State `colOrder: number[]` — array de índices que define a ordem de exibição (ex: `[0,1,2,3,4,5,6,7,8,9,10]`)
- Inicializar do `localStorage` (key: `todolist_col_order`)
- No `<th>`: `draggable`, `onDragStart` (guarda índice), `onDragOver` (previne default), `onDrop` (reordena array)
- Renderizar headers e cells na ordem definida por `colOrder`
- Persistir no `localStorage` a cada mudança
- Cursor `grab` no header para indicar arrasto
- `colWidths` acompanha a reordenação

### Arquivos impactados

| Arquivo | Mudança |
|---|---|
| `src/components/admin/PriorityListView.tsx` | Todas as mudanças acima |

Nenhuma migração necessária.


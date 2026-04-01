

## Navegação lateral do Kanban — Setas flutuantes + Scroll via roda do mouse

### Mudanças

**Arquivo**: `src/components/admin/KanbanBoard.tsx`

1. **Ref no container** — Adicionar `useRef` no `div.flex.gap-4.overflow-x-auto` (linha 381)

2. **Wheel handler** — `onWheel` no container: converte `deltaY` em `scrollLeft` (scroll horizontal com roda vertical do mouse), com `e.preventDefault()` para evitar scroll vertical da página

3. **Setas flutuantes** — Dois botões `ChevronLeft` / `ChevronRight` posicionados `absolute` nas bordas esquerda/direita do container, centralizados verticalmente:
   - Semi-transparentes com `backdrop-blur-sm`, `bg-white/80`, sombra suave
   - `h-8 w-8`, `rounded-full`
   - Scroll suave de ~290px (largura de uma coluna) por clique
   - **Auto-hide**: monitorar `scrollLeft` via evento `scroll` — esconder seta esquerda quando no início, seta direita quando no final

4. **Wrapper relativo** — Envolver o container de scroll + setas num `div relative` para posicionamento absoluto das setas

### Detalhes técnicos

- State: `canScrollLeft` e `canScrollRight` (booleans) atualizados via `onScroll` + `ResizeObserver`
- Setas com `transition-opacity` para aparecer/desaparecer suavemente
- `pointer-events-none` quando invisível para não bloquear drag-and-drop


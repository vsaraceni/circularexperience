

## Fase 2 Restante — Notas Manuais + Filtros + Contadores

### 1. Notas manuais no Drawer (aba Atividades)

**Arquivo**: `src/components/admin/LeadDrawer.tsx`

Adicionar na aba "Atividades", acima do `<ActivityTimeline>`:
- `<Textarea>` com placeholder "Adicionar nota..." + botão "Salvar"
- Ao salvar: insert em `lead_activities` com `activity_type = 'nota_manual'`, `content = texto`, `user_id`
- Atualizar `last_activity_at` do lead
- Recarregar timeline (passar callback `onNoteAdded` ou usar key para re-render)

**Arquivo**: `src/components/admin/ActivityTimeline.tsx`
- Adicionar `nota_manual` ao `ICON_MAP` (ícone `StickyNote` ou `MessageSquare`)
- Aceitar prop `refreshKey` para forçar re-fetch ao adicionar nota

**Arquivo**: `src/components/admin/KanbanBoard.tsx`
- Passar `userId` ao `LeadDrawer` para o insert da nota
- Atualizar `LeadDrawer` props para incluir `onNoteAdded` → chamar `onLeadUpdated`

### 2. Filtros no Kanban (busca, fonte, responsável)

**Arquivo**: `src/pages/admin/Proposals.tsx`

Adicionar barra de filtros entre o título e o KanbanBoard (só visível em `viewMode === "kanban"`):
- **Input de busca** (nome, empresa, email) — filtro client-side no array `allLeads`
- **Select de origem** (LP, manual, indicação, etc.) — valores extraídos de `allLeads`
- **Select de responsável** — query em `profiles` para listar usuários admin

Filtrar `allLeads` antes de passar ao `<KanbanBoard>`, criando `filteredLeads`.

### 3. Contador e valor no header da coluna

**Arquivo**: `src/components/admin/KanbanColumn.tsx`

- Receber prop `proposals: Proposal[]` (propostas vinculadas aos leads da coluna)
- No header, além do count de leads, mostrar soma de `investment` (parsear valores numéricos)
- Formato: `3 leads · R$ 45.000`

**Arquivo**: `src/components/admin/KanbanBoard.tsx`
- Passar propostas filtradas por lead_id para cada coluna
- Requer que `KanbanBoard` receba `proposals` como prop

**Arquivo**: `src/pages/admin/Proposals.tsx`
- Passar `proposals` ao `KanbanBoard`

---

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `LeadDrawer.tsx` | Textarea de notas + insert na timeline |
| `ActivityTimeline.tsx` | Ícone `nota_manual`, prop `refreshKey` |
| `KanbanBoard.tsx` | Props `userId`→drawer, `proposals`, repasse de dados |
| `KanbanColumn.tsx` | Exibir soma de investimento no header |
| `Proposals.tsx` | Barra de filtros, fetch de profiles, filteredLeads, passar proposals |

### Sem alteração de banco
Todas as tabelas necessárias já existem (`lead_activities`, `leads`, `proposals`, `profiles`).


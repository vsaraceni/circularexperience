

## Implementação: Visão "To-Do List" como Tabela Matricial (Proposta B)

### Resumo

Substituir a visão atual de cards agrupados por urgência por uma **tabela estilo planilha** com ordenação por coluna e filtros inline em cada header. O toggle será renomeado de "Prioridades" para "To-Do List".

### Arquivos impactados

| Arquivo | Ação |
|---------|------|
| `src/components/admin/PriorityListView.tsx` | **Reescrita total** — tabela matricial com filtros inline por coluna |
| `src/pages/admin/Pipeline.tsx` | Renomear label para "To-Do List", ícone `Table2`, passar `profiles` |

### Estrutura da tabela

```text
┌─────────────┬──────────┬────────────┬────────┬───────┬────────────┬──────────────┬──────────┬────────┬───────────┐
│ Empresa ▼   │ Contato  │ Etapa 🔽   │ SLA ▼🔽│Porte🔽│Responsável🔽│ Próx. Ação  │ Valor ▼  │Origem🔽│ Últ. Ativ │
├─────────────┼──────────┼────────────┼────────┼───────┼────────────┼──────────────┼──────────┼────────┼───────────┤
│██ Acme Corp │ João     │ [Call]     │ 🔴 3d  │ T1    │ Maria      │ Enviar prop  │ R$50.000 │ Meta   │ 01/04     │
│██ Beta Ltd  │ Maria    │ [Proposta] │ ⚠️ 1d  │ T2    │ Pedro      │ Follow-up    │ R$12.000 │ LP     │ 03/04     │
└─────────────┴──────────┴────────────┴────────┴───────┴────────────┴──────────────┴──────────┴────────┴───────────┘
██ = borda lateral colorida por urgência SLA
🔽 = filtro inline (popover com checkboxes)
▼  = coluna ordenável (click no header)
```

### Colunas

| # | Coluna | Ordenável | Filtro Inline |
|---|--------|-----------|---------------|
| 1 | Empresa | Sim (A-Z) | — |
| 2 | Contato | — | — |
| 3 | Etapa | Sim | Multi-select (6 etapas) |
| 4 | SLA | Sim (tempo) | Multi-select (Vencido/Atenção/No prazo) |
| 5 | Porte | Sim | Multi-select (Tier 1/2/3) |
| 6 | Responsável | Sim | Multi-select (profiles) |
| 7 | Próx. Ação | — | — |
| 8 | Valor | Sim (R$) | — |
| 9 | Origem | — | Multi-select (origens únicas) |
| 10 | Última Ativ. | Sim | — |

### Funcionalidades

- **Ordenação**: click no header alterna asc/desc com seta visual (ChevronUp/Down)
- **Filtros inline**: ícone Filter em headers filtráveis, abre Popover com checkboxes; ícone azul quando ativo; filtros aditivos aos filtros globais do Pipeline
- **Visual**: borda lateral esquerda colorida por urgência (vermelho/âmbar/verde); header sticky; hover na linha
- **Interação**: click na linha abre LeadDrawer (mesmo comportamento atual)
- **Dados**: reutiliza `filteredLeads` do Pipeline; urgência via `getUrgencyLevel()`; tier via `TIER_MAP`; valor formatado `Intl.NumberFormat`; data `dd/MM HH:mm`

### Detalhes técnicos

**`PriorityListView.tsx`** — reescrita completa:
- States: `sortCol`, `sortDir` (asc/desc/null), `columnFilters: Record<string, string[]>`
- Filtros inline derivam opções dinamicamente dos dados (origens únicas, profiles existentes)
- Mantém todos os dialogs existentes (LeadDrawer, LostDialog, SubmissionDialog, ContactDialog) e quick actions
- Props mantidas (mesma interface), sem breaking changes no Pipeline

**`Pipeline.tsx`**:
- Label "Prioridades" → "To-Do List"
- Ícone `ListChecks` → `Table2`
- Sem outras mudanças estruturais

### Sem migração SQL

Todos os campos já existem nas tabelas. Apenas lógica de apresentação no frontend.




## Edição de Leads + Campo "Calor" (Prioridade) do Lead

### Análise de impacto

O campo `calor` (heat/priority 1-3) é um novo atributo do lead, armazenado no banco como `lead_heat` (integer nullable, valores 1/2/3). Ele precisa ser:
- Persistido no banco (nova coluna na tabela `leads`)
- Editável inline na To-Do List (clique direto nas bolinhas)
- Filtrável e ordenável como as demais colunas
- Visível no Drawer (aba Resumo)
- Incluído no tipo `Lead` do frontend

### Representação visual

```text
Calor 1:  🟡         (1 bolinha amarela)
Calor 2:  🟡🟠       (1 amarela + 1 laranja)  
Calor 3:  🟡🟠🔴     (1 amarela + 1 laranja + 1 vermelha)
Sem calor: ○○○       (3 bolinhas cinza/vazias)
```

Cores: `#F4A736` (amarela), `#E65100` (laranja), `#D32F2F` (vermelha).

---

### Plano de implementação

**1. Migração — adicionar coluna `lead_heat` na tabela `leads`**
- `ALTER TABLE leads ADD COLUMN lead_heat integer DEFAULT NULL;`
- Valores permitidos: NULL (não definido), 1, 2, 3

**2. Atualizar tipo `Lead`** em `src/components/admin/LeadList.tsx`
- Adicionar `lead_heat?: number | null;`

**3. Componente `HeatDots`** — novo componente reutilizável
- Recebe `value: number | null` e `onChange?: (v: number) => void`
- Renderiza 3 círculos (SVG ou divs) com as cores definidas
- Se `onChange` existe, cada bolinha é clicável para definir o valor (clicar na mesma remove = volta a null)
- Sem onChange, é apenas visual

**4. To-Do List (`PriorityListView.tsx`)**
- Adicionar coluna "Calor" entre "Porte" e "Responsável"
- Header com `SortableHeader` + `ColumnFilter` (opções: "🟡 Baixo", "🟡🟠 Médio", "🟡🟠🔴 Alto")
- Célula usa `HeatDots` com `onChange` inline — clique faz update direto no Supabase sem abrir modal
- `e.stopPropagation()` para não abrir o drawer ao clicar
- Sortable: leads com calor 3 ficam no topo (desc)
- Ajustar `DEFAULT_COL_WIDTHS` para incluir nova coluna (70px)
- Adicionar state `filterCalor` e lógica no `filteredRows`

**5. Drawer — aba Resumo (`LeadDrawer.tsx`)**
- Dentro do accordion "Dados do Lead", adicionar nova `InfoRow` com `HeatDots` editável
- Ao clicar, faz update no Supabase e dispara `onNoteAdded`

**6. Edição geral do lead (`LeadEditDialog.tsx`)**
- O dialog de edição já existe. Incluir o campo `lead_heat` nele também, como um seletor simples (ou HeatDots)

---

### Arquivos impactados

| Arquivo | Mudança |
|---|---|
| Migração SQL | `ADD COLUMN lead_heat integer` |
| `src/components/admin/LeadList.tsx` | Adicionar `lead_heat` ao tipo `Lead` |
| `src/components/admin/HeatDots.tsx` | **Novo** — componente visual das bolinhas |
| `src/components/admin/PriorityListView.tsx` | Nova coluna, filtro, sort, edição inline |
| `src/components/admin/LeadDrawer.tsx` | Linha no resumo com HeatDots editável |
| `src/components/admin/LeadEditDialog.tsx` | Campo lead_heat no form |
| `src/components/admin/PriorityCard.tsx` | Exibir HeatDots (read-only) |
| `src/components/admin/LeadCard.tsx` | Exibir HeatDots (read-only) no Kanban |




## Adicionar filtro por Porte (Tier) no Pipeline

### O que será feito
Adicionar um novo filtro "Porte da empresa" no popover de filtros, com 3 opções baseadas no campo `colaboradores`:

- **Tier 1**: `501_a_2000`, `mais_de_2000`, `acima_de_2000`
- **Tier 2**: `101_a_500`
- **Tier 3**: `até_100`, `51_a_100`, `11_a_50`, `1_a_10`

O filtro será multi-select com chips (mesmo padrão visual do filtro de "Etapa do funil").

### Mudanças

| Arquivo | Detalhe |
|---------|---------|
| `src/pages/admin/Pipeline.tsx` | Novo state `filterTier`, lógica de filtragem no `filteredLeads`, chips no popover, incluir no `activeFilterCount` e no "Limpar filtros" |

Nenhuma migração SQL necessária — o campo `colaboradores` já existe na tabela `leads`.

### Detalhes técnicos

- Novo state: `const [filterTier, setFilterTier] = useState<string[]>([]);`
- Mapeamento dos valores do banco para tiers:
```typescript
const TIER_MAP: Record<string, string[]> = {
  "tier1": ["501_a_2000", "mais_de_2000", "acima_de_2000"],
  "tier2": ["101_a_500"],
  "tier3": ["até_100", "51_a_100", "11_a_50", "1_a_10"],
};
```
- No `filteredLeads`, se `filterTier.length > 0`, filtrar leads cujo `colaboradores` esteja nos valores mapeados dos tiers selecionados
- Chips renderizados entre o filtro de "Etapa do funil" e o de ordenação, com label "Porte da empresa"
- Contagem de filtros ativos inclui `filterTier.length`


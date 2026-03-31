

## Importar Escopo/Considerações — Popover com busca e lista inteligente

### Problema atual

O `ImportButton` carrega apenas 5 propostas recentes (`limit(5)`) sem busca. Insuficiente quando o catálogo cresce.

### Estratégia

Combinar **busca por texto** + **lista pré-carregada das 15 mais recentes** num popover mais amplo com scroll. Sem complexidade de "mais copiadas" (exigiria tracking de uso — overhead desnecessário neste momento).

### Implementação

**Arquivo**: `src/components/admin/ProposalForm.tsx` — refatorar o `ImportButton`

1. **Ampliar query inicial** de `limit(5)` para `limit(15)` — carrega as 15 mais recentes com `scope` ou `considerations` preenchidos

2. **Adicionar campo de busca** no topo do popover:
   - Input com placeholder "Buscar por empresa ou título..."
   - Filtra localmente a lista já carregada (client-side filter por `title` e `company_name`, case-insensitive)
   - Se o texto de busca tiver 3+ caracteres e não houver resultados locais, faz query ao banco com `ilike` para buscar além das 15 pré-carregadas

3. **Layout do popover melhorado**:
   - Largura: `w-80` (320px, era 272px)
   - ScrollArea com `max-h-[280px]` para comportar a lista maior
   - Input de busca fixo no topo (fora do scroll)
   - Cada item mostra: título (truncate), empresa (muted), e data relativa (ex: "há 3 dias")
   - Preview do conteúdo: ao hover, mostrar tooltip com os primeiros 120 chars do campo (strip HTML tags)

4. **Feedback visual ao importar**:
   - Após selecionar, fechar popover + toast sutil "Conteúdo importado"

### Fluxo

```text
┌─────────────────────────────────┐
│ 🔍 Buscar por empresa ou título │
├─────────────────────────────────┤
│ Proposta — Ambev          3d    │
│ Ambev S.A.                      │
│─────────────────────────────────│
│ Proposta — Natura         1sem  │
│ Natura &Co                      │
│─────────────────────────────────│
│ ...                  (scroll)   │
└─────────────────────────────────┘
```

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `ProposalForm.tsx` | Refatorar `ImportButton`: busca, limit 15, ScrollArea, preview, toast |

### Notas técnicas

- A busca remota (fallback) usa `.ilike('title', `%${term}%`)` com `.or()` para `company_name`
- Strip HTML no preview via `text.replace(/<[^>]*>/g, '').slice(0, 120)`
- Data relativa via cálculo simples (dias/semanas) sem lib externa
- Sem necessidade de migração SQL — usa a mesma tabela `proposals`


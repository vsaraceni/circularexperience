

## Otimizar tamanho dos filtros do Pipeline

### Problema

Os filtros ocupam espaço excessivo na linha: campo de busca muito largo (`max-w-[320px]`), selects com widths generosos (140-160px), e `h-9` + `text-sm` resultam em elementos maiores que o necessário para controles secundários.

### Mudanças

**Arquivo**: `src/pages/admin/Proposals.tsx`

| Elemento | Atual | Novo |
|----------|-------|------|
| Input busca | `max-w-[320px]`, `min-w-[200px]`, `h-9`, `text-sm` | `max-w-[220px]`, `min-w-[160px]`, `h-8`, `text-xs` |
| Select Origem | `w-[150px]`, `h-9`, `text-sm` | `w-[130px]`, `h-8`, `text-xs` |
| Select Responsável | `w-[160px]`, `h-9`, `text-sm` | `w-[140px]`, `h-8`, `text-xs` |
| Select Período | `w-[150px]`, `h-9`, `text-sm` | `w-[130px]`, `h-8`, `text-xs` |
| Select Status | `w-[140px]`, `h-9`, `text-sm` | `w-[130px]`, `h-8`, `text-xs` |
| Search icon | `top-2.5`, `h-4 w-4` | `top-2`, `h-3.5 w-3.5` |
| Clear button | `top-2.5` | `top-2` |
| Gap entre filtros | `gap-3` | `gap-2` |

Reduz altura de 36px para 32px, fonte menor (`text-xs` = 12px vs `text-sm` = 14px), e larguras mais compactas. Os filtros ficam visualmente mais discretos, liberando espaço para o conteúdo principal (kanban).


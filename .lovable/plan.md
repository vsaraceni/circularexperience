

# Corrigir overflow do slide Metodologia na apresentação

## Problema
O conteúdo do `MethodologyFull.tsx` ultrapassa os 1080px do slide, fazendo o título "O que seu time vai aprender" ficar escondido atrás dos cards superiores. O `SlideWrapper` tem `overflow-y-auto` mas visualmente o conteúdo precisa caber sem scroll.

## Mudanças em `src/components/presentation/slides/MethodologyFull.tsx`

| Elemento | Atual | Novo |
|----------|-------|------|
| Section padding | `py-6` | `py-4` |
| Header margin | `mb-4` | `mb-3` |
| Logo height | `h-14` | `h-12` |
| Logo margin | `mb-3` | `mb-2` |
| Steps grid margin | `mb-6` | `mb-4` |
| Step number badge | `w-12 h-12 mb-3` | `w-10 h-10 mb-2` |
| Step card padding | `p-4` | `p-3` |
| Step icon box | `w-10 h-10 mb-3` | `w-8 h-8 mb-2` |
| Benefits container padding | `p-5` | `p-4` |
| Benefits title margin | `mb-3` | `mb-2` |

Reduzir marginais e paddings em ~25% para garantir que tudo caiba nos 1080px sem scroll.

## Arquivo impactado
- `src/components/presentation/slides/MethodologyFull.tsx`


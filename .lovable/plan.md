

# Aumentar fontes e cards da Agenda

## Problema
As fontes estão muito pequenas (`text-xs` descrição, `text-base` título, `text-xs` badge) e os cards têm padding mínimo (`p-2.5`). Há espaço horizontal não aproveitado.

## Mudanças em `src/components/landing/Agenda.tsx`

| Elemento | Atual | Novo |
|----------|-------|------|
| Container timeline | `max-w-3xl` | `max-w-5xl` |
| Card padding | `p-2.5` | `p-4` |
| Time badge text | `text-xs` | `text-sm` |
| Time badge icon | `w-3 h-3` | `w-3.5 h-3.5` |
| Título do card | `text-base` | `text-lg` |
| Descrição | `text-xs` | `text-sm` |
| Gap entre items | `mb-1` | `mb-0.5` (reduzir distância vertical) |
| Card width | `lg:w-[calc(50%-40px)]` | `lg:w-[calc(50%-28px)]` (mais largo, menos gap da linha central) |

Título e subtítulo da seção já estão no padrão (`text-3xl md:text-4xl` e `text-base md:text-lg`), sem alteração.

## Arquivo impactado
- `src/components/landing/Agenda.tsx`


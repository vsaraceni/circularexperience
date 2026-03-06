

# Corrigir cores do slide Metodologia no Print

## Problema
O `MethodologyFullPrint.tsx` usa cores erradas: verde (#16A34A) para "Metodologia" e ícones, laranja (#F97316) e azul (#0EA5E9) nos cards. A paleta real do projeto é roxo (#5F2558), teal (hsl 174 72% 40% ≈ #1BA39C), e amarelo/âmbar (hsl 45 100% 50%).

## Mudanças em `src/components/presentation/slides/MethodologyFullPrint.tsx`

| Elemento | Atual | Correto |
|----------|-------|---------|
| "Metodologia" no título | `#16A34A` (verde) | `#5F2558` (roxo primary) |
| Step 1 color (number badge + icon) | `#F97316` (laranja) | `#1BA39C` (teal/secondary) |
| Step 2 color | `#16A34A` (verde) | `#5F2558` (roxo/primary) |
| Step 3 color | `#0EA5E9` (azul) | `#E6A817` (âmbar/accent) |
| Bullet dots nos benefits | `#16A34A` (verde) | `#5F2558` (roxo) |

## Arquivo impactado
- `src/components/presentation/slides/MethodologyFullPrint.tsx`


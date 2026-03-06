

# Correção geral: cores verdes no print + Hero não preenchendo o slide

## Problemas identificados

1. **AboutPrint.tsx** — Usa verde (#228B22, #32CD32) em todo o slide: badge, título "Economia Circular", centro do wheel, círculo tracejado, e todos os 7 ícones
2. **AgendaPrint.tsx** — Usa verde no título "Agenda", linha vertical do timeline, dots dos itens, e badges de tempo
3. **Hero no print** — O `slide-container` usa `display: flex; align-items: center; justify-content: center`, mas o Hero não tem dimensões fixas. Ele usa `min-h-screen` (Tailwind) que pode não preencher corretamente. Resultado: imagem de fundo compartimentada

## Mudanças

### 1. `AboutPrint.tsx` — Trocar todos os verdes por roxo
| Elemento | Verde atual | Roxo correto |
|----------|-------------|-------------|
| Badge background | `rgba(34,139,34,0.1)` | `rgba(95,37,88,0.1)` |
| Badge icon + text | `#228B22` | `#5F2558` |
| Título gradient | `#228B22, #32CD32` | `#5F2558, #7B3F74` |
| Centro do wheel | `#228B22, #32CD32` | `#5F2558, #7B3F74` |
| Shadow do centro | `rgba(34,139,34,0.3)` | `rgba(95,37,88,0.3)` |
| Círculo tracejado | `rgba(34,139,34,0.3)` | `rgba(95,37,88,0.3)` |
| Ícones dos 7 R's | `#228B22, #32CD32` | `#5F2558, #7B3F74` |

### 2. `AgendaPrint.tsx` — Trocar todos os verdes por roxo
| Elemento | Verde atual | Roxo correto |
|----------|-------------|-------------|
| Título gradient | `#228B22, #32CD32` | `#5F2558, #7B3F74` |
| Linha vertical | `#228B22, #32CD32, #90EE90` | `#5F2558, #7B3F74, #C4A0BF` |
| Dots do timeline | `#228B22, #32CD32` | `#5F2558, #7B3F74` |
| Badge tempo bg | `rgba(34,139,34,0.1)` | `rgba(95,37,88,0.1)` |
| Badge tempo icon + text | `#228B22` | `#5F2558` |

### 3. `PrintablePresentation.tsx` — Corrigir CSS do slide-container
Adicionar regra para forçar filhos a preencher o container:
```css
.slide-container > * {
  width: 100% !important;
  min-height: 100%;
}
```
Isso garante que componentes responsivos (Hero, SocialProof, Stats, SDGs) preencham os 1920x1080px sem ficar compartimentados.

## Arquivos impactados
- `src/components/presentation/slides/AboutPrint.tsx`
- `src/components/presentation/slides/AgendaPrint.tsx`
- `src/pages/PrintablePresentation.tsx`


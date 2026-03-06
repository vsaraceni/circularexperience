

# Corrigir centralização, corte de margem e remover CTA

## Problema
1. Os slides de 1920px estão sendo renderizados sem escala — o Browserless captura a página como está, mas a página A4 landscape tem proporções diferentes, causando corte na direita.
2. O slide CTA (índice 10) não deve aparecer na proposta.

## Causa raiz
A página `PrintablePresentation` renderiza divs de 1920×1080px, mas o Browserless gera o PDF em formato A4 landscape (297×210mm). O conteúdo de 1920px é maior que a viewport padrão do Browserless, causando o corte. Precisamos usar `scale` no CSS para ajustar o conteúdo ao tamanho da página A4, ou configurar o viewport do Browserless para 1920px.

## Solução

### 1. Remover CTA dos slides fixos (`PrintablePresentation.tsx`)
Remover `CTA` do array `fixedSlides` — ele não deve aparecer na proposta PDF.

### 2. Configurar viewport no Browserless (`generate-pdf/index.ts`)
Adicionar `"viewport": { "width": 1920, "height": 1080 }` na chamada ao Browserless para que ele use a mesma resolução dos slides, evitando corte.

### 3. Ajustar escala CSS para caber no A4 (`PrintablePresentation.tsx`)
Usar `transform: scale()` nos `.slide-container` para escalar o conteúdo de 1920×1080 para caber perfeitamente na página A4 landscape, centralizando com `transform-origin: top center` e `margin: 0 auto`.

Alternativa mais simples: em vez de escalar no CSS, definir a `preferCSSPageSize: true` e usar `@page { size: 1920px 1080px }` para que cada "página" do PDF tenha exatamente o tamanho do slide.

## Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/PrintablePresentation.tsx` | Remover CTA do array; ajustar `@page` size para `1920px 1080px` |
| `supabase/functions/generate-pdf/index.ts` | Adicionar viewport 1920×1080; usar `preferCSSPageSize: true` em vez de `format: "A4"` |


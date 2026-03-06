

# Fix: Logo ocupando slide inteiro

## Problema
A regra CSS `.slide-container > *` força `width: 100% !important` e `min-height: 100%` em **todos** os filhos — incluindo o `<img>` do logo.

## Solução (cirúrgica, zero impacto no resto)

### `src/pages/PrintablePresentation.tsx`

1. **CSS** (linha 89): Trocar o seletor para excluir elementos com position absolute:
```css
.slide-container > *:not(.slide-logo-overlay) {
  width: 100% !important;
  min-height: 100%;
}
```

2. **Logo `<img>`** (linha 110): Adicionar `className="slide-logo-overlay"` ao elemento existente. Nada mais muda.

Apenas 2 linhas alteradas, mesmo arquivo, sem tocar em nenhum outro componente.


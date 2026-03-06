

# Ajustar posição do logo no slide 2

## Mudança

### `src/pages/PrintablePresentation.tsx` (linha 110)

Atualizar o style inline do logo:
- `top: 40` → `top: 20`
- `left: 60` → remover, usar `right: 20`

Também adicionar regras CSS para `.slide-logo-overlay` garantindo que não estoure:
```css
.slide-logo-overlay {
  height: 50px !important;
  width: auto !important;
  min-height: 0 !important;
  display: block !important;
}
```

E atualizar `.slide-center-content > *` para `.slide-center-content > *:not(.slide-logo-overlay)`.


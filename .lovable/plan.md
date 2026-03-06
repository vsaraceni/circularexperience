

# Trocar texto do botão na capa (apenas versão impressa)

## Abordagem
Adicionar uma prop opcional `printMode?: boolean` ao componente `Hero`. Quando `true`, o texto do botão muda de "Receber mais informações" para "Proposta Circular Experience". Nenhuma outra alteração.

## Mudanças

### 1. `src/components/landing/Hero.tsx`
- Adicionar prop `printMode?: boolean` (default `false`)
- No botão principal, usar `printMode ? "Proposta Circular Experience" : "Receber mais informações"`

### 2. `src/pages/PrintablePresentation.tsx`
- Substituir `Hero` no array `fixedSlides` por um wrapper inline que passa `printMode={true}`
- Ou renderizar o Hero separadamente antes do map, com a prop

## Arquivos impactados
- `src/components/landing/Hero.tsx` (1 linha de prop + 1 linha de texto condicional)
- `src/pages/PrintablePresentation.tsx` (ajuste mínimo na renderização do slide 0)


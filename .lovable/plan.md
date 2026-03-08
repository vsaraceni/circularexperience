

## Comprimir layout da proposta para caber em 1 página

### Mudanças

**1. `ProposalSlide.tsx` (print/PDF 1920x1080)**
- Reduzir paddings gerais do conteúdo principal (de `28px 36px 20px 28px` para `20px 32px 14px 24px`)
- Reduzir `mb` (margins) do badge, título, meta cards e footer
- Reduzir padding dos MetaCards (de `10px 14px` para `7px 12px`) e font sizes dos labels
- **Escopo e Considerações**: mudar de `flex` (lado a lado) para `flex-col` (empilhados verticalmente), reduzir padding interno dos ContentBlocks
- Reduzir gap entre os blocos

**2. `ProposalView.tsx` (web responsivo)**
- Mesma mudança: Escopo e Considerações de `flex-col md:flex-row` para sempre `flex-col` (empilhados)
- Comprimir margens e paddings dos MetaCards e ContentBlocks para consistência visual

**3. Componentes internos (MetaCard, ContentBlock) em ambos os arquivos**
- MetaCard: padding `7px 12px`, label fontSize 7, value fontSize 12
- ContentBlock: padding `10px 14px`, fontSize 11, label fontSize 11

### Resultado esperado
Todo o conteúdo da proposta cabe dentro dos 1080px de altura do slide, sem overflow.




## Plano: Mostrar nome da proposta no botão CTA do Hero (versão print)

Atualmente o botão roxo do Hero em `printMode` exibe o texto fixo "Proposta Circular Experience". O objetivo é substituí-lo pelo `title` da proposta (ex: "Proposta — Empresa X").

### Alterações

**1. `src/components/landing/Hero.tsx`**
- Adicionar prop opcional `proposalTitle?: string`
- No texto do botão em `printMode`, usar `proposalTitle` se disponível, senão manter fallback "Proposta Circular Experience"

**2. `src/pages/PrintablePresentation.tsx`**
- Alterar `HeroPrint` de componente fixo (no array) para renderização inline que passa `proposalTitle={proposal?.title}`

**3. `src/pages/ProposalView.tsx`**
- Mesma alteração: passar `proposalTitle={proposal?.title}` ao `Hero` em printMode


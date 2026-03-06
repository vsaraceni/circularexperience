# Atualizar ProposalView para o layout novo (Versão C)

## Contexto

A página `/proposta/:slug` (`ProposalView.tsx`) ainda usa o layout antigo — um card simples com header gradiente e conteúdo empilhado. Já construímos o layout "Structured (Versão C)" no `ProposalSlide.tsx` com sidebar roxa, metadados em cards, QR code, bloco de assinatura alinhado à direita, etc.

O objetivo é replicar esse mesmo design no `ProposalView`, mas adaptado para web responsivo (não fixo em 1920x1080).

## Plano

### `src/pages/ProposalView.tsx` — Reescrever o layout

Manter toda a lógica de fetch e estados (loading, notFound). Substituir apenas o JSX de renderização para seguir o design do `ProposalSlide`:

1. **Layout com sidebar + área principal** — Em desktop, usar flex row. Em mobile, empilhar verticalmente.
2. **Sidebar roxa** (gradiente `hsl(307 44% 32%)` → `hsl(307 44% 18%)`):
  - Logo branco (120px)
  - Label "Proposta Comercial" 
  - Card de investimento semi-transparente
  - QR Code com label "Acesse esta proposta online"
3. **Área principal** (`#FAFAFA`):
  - Título com border-bottom
  - Grid de metadados (Empresa, Contato, Data, Validade) usando o mesmo estilo `MetaCard`
  - Escopo e Considerações com `proposal-html-content` (sem clamp de linhas, já que na web pode rolar)
  - Divider + frase de agradecimento + bloco de assinatura
  - Footer "Movimento Circular © ano"

Nenhum outro arquivo será alterado. A lógica do `ProposalSlide.tsx` e `PrintablePresentation.tsx` permanece intacta.  
  
  
A ideia aqui é que toda a proposta seja apresentada, todos os slides + slide proposta, compreende?
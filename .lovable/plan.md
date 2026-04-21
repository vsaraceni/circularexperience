

## Revisão objetiva: por que o PDF ainda puxa a landing page

Hoje o comportamento errado continua por 3 motivos que ainda coexistem no código:

1. `supabase/functions/generate-pdf/index.ts` ainda tem um ramo **LEGACY MODE**:
   - se `proposal.master_asset_id` não existir
   - e se não houver `proposal_master_assets.is_active` para o `product_id`
   - então ele renderiza `/apresentacao-print/:slug` inteiro

2. `src/pages/PrintablePresentation.tsx` ainda mantém **dois modos**:
   - `slide-only` = só `ProposalSlide`
   - modo padrão = **landing inteira + slide**
   Ou seja: qualquer chamada sem `?mode=slide-only` continua renderizando a LP.

3. A visualização online da proposta ainda está viva no projeto:
   - rota `/proposta/:slug` em `src/App.tsx`
   - página `src/pages/ProposalView.tsx`
   - QR code em `src/components/presentation/slides/ProposalSlide.tsx`
   - ações de “Copiar link” e “Ver proposta” em `src/components/admin/ProposalList.tsx`

Seu objetivo está correto e precisa ser implementado de forma mais dura: **parar de existir qualquer caminho que renderize landing page no PDF ou exponha proposta online**.

---

## Implementação correta

### 1) Tornar `PrintablePresentation` exclusivamente “slide da proposta”
Arquivo: `src/pages/PrintablePresentation.tsx`

Trocar a página para um único comportamento:
- buscar a proposta por `slug`
- renderizar apenas:
  - container 1920x1080
  - `ProposalSlide`
- remover completamente:
  - `useSearchParams`
  - `slideOnly`
  - `fixedSlides`
  - imports da landing (`Hero`, `SocialProof`, `Stats`, `AboutPrint`, `MethodologyFullPrint`, `AgendaPrint`, `VideoPrint`, `ExpertsPrint`, `SDGs`)
  - `mcLogoHorizontal`
  - todo o JSX do “Legacy mode”

Resultado:
- `/apresentacao-print/:slug` passa a significar sempre: **somente o slide comercial**
- não existe mais modo alternativo que imprima a LP

---

### 2) Remover de vez o fallback legado do `generate-pdf`
Arquivo: `supabase/functions/generate-pdf/index.ts`

Ajustar a lógica para:

```text
resolver proposal
→ tentar master_asset_id explícito
→ senão tentar master ativo do produto
→ se não encontrar master: retornar 422
→ se encontrar: baixar master + renderizar /apresentacao-print/:slug + merge
```

Mudanças específicas:
- remover o bloco `LEGACY MODE`
- não usar mais `fast=false` / `mode=slide-only`
- renderizar sempre:
  - master PDF canônico
  - + uma página dinâmica gerada a partir de `/apresentacao-print/:slug`

Mensagem de erro sugerida para 422:
- `"Proposta sem PDF mestre. Associe um produto com PDF mestre ativo antes de gerar o PDF."`

Resultado:
- PDF nunca mais poderá nascer da landing page
- se faltar master, o sistema falha com mensagem clara em vez de gerar PDF errado

---

### 3) Ajustar o front para exibir o erro real
Arquivo: `src/components/pdf/PdfExporter.tsx`

Hoje o front engole a causa e mostra toast genérico.

Ajustar para:
- ler `response.status`
- se vier `422`, mostrar o `error` retornado pela function
- manter toast genérico apenas para falhas inesperadas

Resultado:
- o SDR entende por que o PDF não saiu
- evita a falsa impressão de que “o sistema gerou outra versão”

---

### 4) Remover a visualização online da proposta
Arquivos:
- `src/App.tsx`
- `src/pages/ProposalView.tsx`

Mudanças:
- remover rota `/proposta/:slug` do `CrmRoutes`
- remover rota `/proposta/:slug` do `SiteRoutes`
- excluir `ProposalView.tsx` ou deixá-lo fora de uso imediato para limpeza posterior

Importante:
- manter `/apresentacao-print/:slug` porque ela é interna ao fluxo de geração do PDF
- manter `slug` na tabela `proposals`, pois ele continua sendo chave interna da renderização

Resultado:
- deixa de existir proposta pública online
- reduz confusão no cenário multi-produto

---

### 5) Remover QR code do slide comercial
Arquivo: `src/components/presentation/slides/ProposalSlide.tsx`

Remover:
- import de `QRCodeSVG`
- cálculo de `proposalUrl`
- bloco visual do QR code
- texto “Acesse esta proposta online”

Reorganizar a sidebar:
- topo: logo + “Proposta Comercial”
- meio: investimento
- base: apenas divisor/ornamento ou respiro visual

Resultado:
- o slide final do PDF não aponta mais para rota pública inexistente
- layout fica coerente com a nova regra

---

### 6) Remover ações de link público no CRM
Arquivo: `src/components/admin/ProposalList.tsx`

Remover:
- função `copyLink`
- botão “Copiar link”
- botão “Ver proposta”
- imports `ExternalLink`, `Copy`, `toast` se ficarem sem uso

Resultado:
- o CRM deixa de sugerir que existe uma visualização web
- o fluxo de proposta passa a ser exclusivamente por PDF

---

## Impacto em dados e histórico

### O que não muda
- tabela `proposals`
- colunas `slug`, `product_id`, `master_asset_id`
- tabela `products`
- tabela `proposal_master_assets`
- view `vw_proposals_leads`
- função `get_proposal_by_slug`
- RLS

### O que muda funcionalmente
- proposta antiga sem master não gera mais PDF errado
- proposta sem master passa a retornar erro explícito
- links públicos deixam de existir
- QR code sai do documento

### Risco principal
Se houver propostas antigas com `product_id` nulo ou produto sem master ativo, elas passarão a falhar com 422.

### Mitigação recomendada
Adicionar uma migração de backfill simples:
- localizar o produto seed `circular-experience`
- preencher `proposals.product_id` onde estiver `NULL`

Depois disso, basta garantir 1 master ativo nesse produto.

Se essa migração não for feita:
- nenhuma proposta antiga sem `product_id` conseguirá gerar PDF

---

## Ordem segura de implementação

1. Ajustar `PrintablePresentation` para slide-only permanente
2. Remover fallback legado em `generate-pdf`
3. Melhorar tratamento de erro em `PdfExporter`
4. Remover rota `/proposta/:slug`
5. Remover QR code de `ProposalSlide`
6. Remover botões de link em `ProposalList`
7. Opcional, mas recomendado: backfill de `product_id` nas propostas antigas

---

## Critério de aceite

A mudança só estará correta quando todos os itens abaixo forem verdade:

- gerar PDF nunca renderiza Hero, Stats, About, Agenda, Experts ou qualquer slide da LP
- o PDF final contém apenas:
  - PDF mestre canônico
  - última página com a proposta comercial dinâmica
- proposta sem master retorna erro claro, não fallback
- `/proposta/:slug` não existe mais
- não há QR code no slide
- não há botão de copiar/ver link da proposta no CRM

---

## Arquivos impactados

- `src/pages/PrintablePresentation.tsx`
- `supabase/functions/generate-pdf/index.ts`
- `src/components/pdf/PdfExporter.tsx`
- `src/App.tsx`
- `src/components/presentation/slides/ProposalSlide.tsx`
- `src/components/admin/ProposalList.tsx`
- `supabase/migrations/*` (opcional, para backfill de `product_id`)
- `src/pages/ProposalView.tsx` (remoção ou desuso)


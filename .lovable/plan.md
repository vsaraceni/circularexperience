

## Multi-produto + PDF Mestre: 2 opções de implementação

### Mapeamento de impactos (válido para ambas opções)

| Área | O que muda | Risco se ignorado |
|---|---|---|
| `proposals` (tabela) | +2 colunas opcionais (`product_id`, `master_asset_id`) | Nenhum se nullable. **NUNCA** alterar/remover colunas existentes. |
| `vw_proposals_leads` (view) | Recriar incluindo as novas colunas | Quebra export Google Sheets se omitido |
| `src/integrations/supabase/types.ts` | Auto-regenerado | Nenhum se aguardar regeneração |
| `ProposalSlide.tsx` | Hardcoded "Circular Experience" e cor roxa | Precisa parametrizar por produto (ou versionar) |
| `ProposalView.tsx` | Renderiza landing inteira + slide | Em multi-produto, landing não cabe mais — precisa tratar |
| `PrintablePresentation.tsx` | Renderiza 9 slides + ProposalSlide | Reduzir para só ProposalSlide |
| `generate-pdf` (edge fn) | Lógica de merge nova | Se quebrar, todas propostas (novas e antigas) param |
| Propostas existentes | `product_id`/`master_asset_id` ficam NULL | Sem fallback → PDF antigo quebra |
| `ProposalList`, `Proposals.tsx` (CRUD) | Persistir 2 novos campos | Sem isso, novas propostas ficam órfãs |
| Slug público `/proposta/:slug` | Continua acessível | QR code aponta para esta URL — não pode quebrar |

### Princípios de segurança comuns às duas opções

1. **Aditivo, nunca destrutivo**: novas colunas nullable; nada existente é renomeado/removido.
2. **Reproduzibilidade**: `master_asset_id` fica salvo na proposta. Trocar a versão depois não muda PDFs antigos.
3. **Fallback em cascata**: se proposta não tem `master_asset_id` → usa `is_active` do `product_id` → usa produto padrão (`circular-experience` seed) → erro 422 explícito.
4. **Bucket privado** + signed URL curta + RLS admin-only no CRUD.
5. **Rollback de 1 clique**: histórico de versões preservado, basta marcar outra como ativa.

---

### Opção A — Coexistência (recomendada, baixo risco)

Mantém o sistema antigo funcionando em paralelo. Propostas novas usam o fluxo Master+Slide; propostas antigas continuam gerando como hoje (landing + slide).

**Como funciona**
- Edge function `generate-pdf` decide por proposta:
  - Se `master_asset_id` existe (ou produto tem mestre ativo) → modo novo (master + slide).
  - Se não → modo legado (renderiza landing inteira como hoje, sem mudar nada).
- `PrintablePresentation.tsx` ganha um parâmetro `?mode=slide-only` para o modo novo. Sem o parâmetro, comportamento atual preservado.
- `ProposalView.tsx` continua igual (visualização web do lead).

**Schema**
```sql
CREATE TABLE products (id, slug UNIQUE, name, brand_color, is_active, sort_order, created_at);
CREATE TABLE proposal_master_assets (id, product_id FK, version, label, storage_path, page_count, is_active, uploaded_by, uploaded_at, notes);
CREATE UNIQUE INDEX one_active_per_product ON proposal_master_assets(product_id) WHERE is_active;
ALTER TABLE proposals ADD COLUMN product_id uuid NULL REFERENCES products(id);
ALTER TABLE proposals ADD COLUMN master_asset_id uuid NULL REFERENCES proposal_master_assets(id);
-- Recriar vw_proposals_leads incluindo product_id (compat Google Sheets)
-- Seed: produto "Circular Experience" (apenas registro; sem mestre = continua legado)
```

**Rollout**
1. Migra schema + bucket + tela `/admin/produtos`.
2. Você sobe primeiro mestre → cria 1 proposta de teste com produto novo → valida PDF.
3. Propostas antigas continuam gerando do jeito antigo (zero impacto).
4. Quando confiar, marca o mestre como obrigatório por produto (decisão futura).

**Prós**: zero risco para propostas existentes; rollback trivial (basta não selecionar produto).
**Contras**: 2 caminhos no código por algum tempo; manter slides legados (`AboutPrint`, etc.).

---

### Opção B — Migração com produto padrão (corte mais limpo)

Todas as propostas passam a usar o fluxo Master+Slide. Backfill: propostas antigas recebem `product_id` do produto seed "Circular Experience".

**Como funciona**
- Migração faz `UPDATE proposals SET product_id = <seed_id> WHERE product_id IS NULL`.
- Você sobe um mestre `v1` ativo no produto seed antes do deploy do front.
- Edge function sempre usa `master_asset_id` da proposta OU mestre ativo do `product_id`.
- `PrintablePresentation.tsx` passa a renderizar só `ProposalSlide` (modo único).
- `ProposalView.tsx`: 2 sub-opções
  - **B1**: continua renderizando landing inteira + slide (visualização web do lead permanece rica).
  - **B2**: passa a mostrar só o slide + link "Ver apresentação completa" para o site.

**Schema**: igual à Opção A + `UPDATE` de backfill.

**Pré-requisito crítico**: subir o mestre v1 ativo **antes** do deploy do front, senão toda geração de PDF retorna 422.

**Prós**: caminho único, código mais simples, slides legados podem ser removidos na fase 2.
**Contras**: janela de risco entre migração e upload do mestre; dependência de você executar passo manual no momento certo.

---

### Comparação rápida

| Critério | Opção A (Coexistência) | Opção B (Migração) |
|---|---|---|
| Risco para propostas atuais | Nenhum | Baixo (depende do upload do mestre v1) |
| Complexidade do código | 2 caminhos temporários | 1 caminho |
| Reversibilidade | Trivial | Precisa restaurar mestre/produto |
| Uniformidade visual | Mista (até backfill manual) | Uniforme imediata |
| Esforço de implementação | Médio | Médio |

**Recomendação**: **Opção A**. Permite validar o fluxo Master+Slide com 1 proposta real antes de assumir compromisso. Em 1-2 semanas, se tudo bem, mover para B com 1 migração simples (`UPDATE ... SET product_id = seed`).

---

### Detalhes técnicos comuns às 2 opções

**Storage**
- Bucket privado `proposal-masters`, path `{product_slug}/{version}.pdf`.
- RLS: admin escreve; service_role lê.
- Validação no upload: MIME `application/pdf`, máx 20MB, `pdf-lib` confere `pageCount > 0`.

**Edge function `generate-pdf` (resumo)**
```ts
// 1. Resolver mestre
const proposal = await getProposalBySlug(slug);
const masterId = proposal.master_asset_id 
  ?? await getActiveMasterId(proposal.product_id)
  ?? await getActiveMasterId(SEED_PRODUCT_ID);  // só Opção A: ?? null → fallback legado

if (!masterId) {
  // Opção A: renderiza modo legado (mantém código atual)
  // Opção B: 422 "Produto sem PDF mestre ativo"
}

// 2. Browserless renderiza só o ProposalSlide (?mode=slide-only)
const slideBuffer = await renderSlide(slug);

// 3. Baixa master via signed URL
const masterBuffer = await downloadMaster(masterId);

// 4. Merge com pdf-lib
const out = await PDFDocument.create();
const [m, s] = await Promise.all([PDFDocument.load(masterBuffer), PDFDocument.load(slideBuffer)]);
(await out.copyPages(m, m.getPageIndices())).forEach(p => out.addPage(p));
(await out.copyPages(s, s.getPageIndices())).forEach(p => out.addPage(p));
return new Response(await out.save(), { headers: pdfHeaders });
```

**Form: seleção em 2 selects no topo**
- `Produto` (default = único produto ativo, senão obrigatório).
- `PDF Mestre` (default = `is_active` do produto; lista versões com label + data).

**Arquivos impactados (Opção A)**

| Arquivo | Mudança |
|---|---|
| `supabase/migrations/*` | Bucket, tabelas `products`, `proposal_master_assets`, +2 colunas em `proposals`, RLS, seed, recriar `vw_proposals_leads` |
| `src/pages/admin/Products.tsx` (novo) | CRUD produtos + gestão de versões de mestre |
| `src/components/admin/CrmNavbar.tsx` | Item "Produtos" (admin only) |
| `src/App.tsx` | Rota `/admin/produtos` |
| `src/components/admin/ProposalForm.tsx` | 2 selects no topo (produto + mestre) |
| `src/pages/admin/Proposals.tsx` | Persistir `product_id`, `master_asset_id` |
| `src/pages/PrintablePresentation.tsx` | Aceitar `?mode=slide-only` (renderiza só ProposalSlide) |
| `supabase/functions/generate-pdf/index.ts` | Lógica de resolução + merge + fallback legado |

Sem mudanças em: `PdfExporter.tsx`, `ProposalView.tsx`, `ProposalSlide.tsx` (parametrização de cor/badge fica para fase 2 quando houver 2º produto), schema base de `proposals` (apenas 2 colunas opcionais).

**Decisões a confirmar antes de implementar**
1. Opção A ou B?
2. Em multi-produto futuro, `ProposalSlide` deve mudar cor/badge por produto? (não bloqueia v1 se ficar fixo Circular Experience)
3. `ProposalView.tsx` (web pública) — manter renderizando landing inteira, ou simplificar?


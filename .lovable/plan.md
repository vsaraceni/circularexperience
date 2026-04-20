

## Produtos como catálogo + template de proposta

Confirmando o entendimento: **Produtos & PDFs Mestres** (`/admin/produtos`) é o catálogo dos produtos do Movimento Circular. Esta evolução transforma cada produto também em **template de proposta**.

### Schema — 3 colunas novas em `products`

```sql
ALTER TABLE products ADD COLUMN default_title_template text;
ALTER TABLE products ADD COLUMN default_scope text;
ALTER TABLE products ADD COLUMN default_considerations text;
```

Todas opcionais, sem backfill. Admin preenche quando quiser.

### Tela `/admin/produtos` — dialog de criar/editar produto

Adicionar 3 campos abaixo dos existentes:

| Campo | UI | Observação |
|---|---|---|
| Título padrão da proposta | `Input` texto | Dica: use `{{empresa}}` para inserir o nome da empresa |
| Escopo padrão | `RichTextEditor` | Mesmo editor já usado em `ProposalForm` |
| Considerações padrão | `RichTextEditor` | Idem |

### Formulário de proposta — pré-preenchimento

Em `ProposalForm.tsx`, ao criar proposta nova:

- Quando o produto é selecionado, busca defaults do produto:
  - `title` ← `default_title_template` com `{{empresa}}` → `company_name`
  - `scope` ← `default_scope` (se vazio)
  - `considerations` ← `default_considerations` (se vazio)
- **Não sobrescreve** campos já editados pelo SDR.
- Em **edição** de proposta existente: nada muda automaticamente.
- Se o SDR trocar o produto, atualiza apenas campos que ainda batem com o template anterior (ou estão vazios).
- Se `company_name` mudar, recalcula o título se ainda casar com o template.

### Arquivos impactados

| Arquivo | Mudança |
|---|---|
| `supabase/migrations/*` (novo) | 3 colunas em `products` |
| `src/pages/admin/Products.tsx` | 3 campos novos no dialog (título + 2 rich text) |
| `src/components/admin/ProposalForm.tsx` | Buscar defaults do produto + lógica de pré-preenchimento |

Sem mudanças em: `generate-pdf`, `PrintablePresentation`, `ProposalSlide`, `PdfExporter`, `vw_proposals_leads`, RLS.

### Princípios

- **Aditivo**: colunas opcionais, propostas existentes inalteradas.
- **Não invasivo**: nunca sobrescreve trabalho do SDR.
- **Reaproveitável**: cada novo produto futuro (workshop diferente, formato diferente) só precisa ser cadastrado uma vez para ter proposta padronizada.




## Vincular Templates de Mensagem a Produtos

### Objetivo
Permitir que cada template em `message_templates` seja **opcionalmente vinculado a um produto** (`products`). Quando o SDR estiver atuando em um lead/proposta de um produto X, o sistema mostra:
- templates específicos daquele produto +
- templates "globais" (sem produto vinculado, válidos para qualquer um).

Sem quebrar nada do que já existe hoje.

---

### Estratégia escolhida

**Vínculo opcional (nullable) em `message_templates.product_id`** + filtragem contextual no front.

Por que assim:
- `product_id NULL` = template global (comportamento atual preservado).
- `product_id = X` = template exclusivo do produto X.
- Zero migração de dados: todos os templates atuais continuam visíveis em todos os contextos.
- Zero nova tabela.
- Reaproveita a tabela `products` que já existe e já é usada em propostas.

Alternativas descartadas:
- Tabela N:N (`message_template_products`): excesso para o caso de uso (1 template tende a pertencer a 1 produto).
- Duplicar templates por produto: bagunça a Central de Templates e quebra overrides.

---

### Mudanças

#### 1) Schema — adicionar coluna opcional
Tabela: `message_templates`

- Adicionar `product_id uuid NULL` referenciando `products(id) ON DELETE SET NULL`.
- Index em `(stage, product_id)` para acelerar filtros do Kanban/Proposta.
- **Sem backfill**: todos os templates existentes ficam com `product_id = NULL` (= globais).

#### 2) Central de Templates (admin) — `src/pages/admin/Templates.tsx` + editor
- No editor de template, adicionar campo **"Produto"** (Select) com:
  - opção `Todos os produtos (global)` → grava `NULL`
  - lista de produtos ativos vinda de `products`
- Na listagem, mostrar um chip `Global` ou `<nome do produto>` ao lado do título.
- Filtro no topo: "Filtrar por produto" para o admin gerenciar com clareza.

#### 3) Hook de templates — `src/hooks/useMessageTemplates.ts`
Atualizar `useTemplatesWithOverrides(stage, userId, productId?)`:
- query passa a buscar templates `WHERE stage = ? AND (product_id IS NULL OR product_id = ?)`.
- ordenação: produto-específico primeiro, depois globais (`ORDER BY product_id NULLS LAST, sort_order`).
- se `productId` não for passado → mantém comportamento atual (todos do estágio).

#### 4) Pontos de consumo no Kanban / Lead
Arquivos: componentes que abrem o popover de templates a partir do `LeadDrawer` / cards.

- Onde o lead tiver `product_id` (via proposta vinculada ou via novo campo de "produto de interesse" no lead — usar o que já existir; hoje o vínculo confiável é `proposals.product_id`), passar esse `productId` ao hook.
- Se não houver produto identificado, hook continua trazendo só globais + todos (comportamento atual).

#### 5) Botão "Enviar Proposta" (do plano anterior)
- Já que esse botão age sobre uma `Proposal`, ele tem `proposal.product_id`.
- Passar esse `product_id` para `useTemplatesWithOverrides("proposta", userId, proposal.product_id)`.
- Resultado: o SDR vê só os textos do produto certo + os textos globais. Sem ruído.

#### 6) UI do seletor quando há múltiplos templates
- Agrupar visualmente no popover:
  - **Seção "Para este produto"** (templates com `product_id` igual)
  - **Seção "Geral"** (templates `NULL`)
- Cada item mostra título + preview curto.

---

### O que NÃO muda
- Tabela `user_template_overrides` (overrides continuam por `template_id`, independente de produto).
- Variáveis (`{{nome}}`, `{{empresa}}`, etc.) e função `replaceVariables`.
- RLS de `message_templates`.
- Estrutura de `products` e `proposals`.
- Comportamento atual para usuários que não usam produtos: tudo continua funcionando.

---

### Arquivos impactados
- **Migration**: adicionar `product_id` em `message_templates` + index.
- `src/hooks/useMessageTemplates.ts` — aceitar e aplicar `productId` opcional.
- `src/pages/admin/Templates.tsx` — UI de filtro + chip de produto.
- Editor de template (provavelmente dentro de `Templates.tsx` ou componente filho) — Select de produto.
- `src/components/admin/SendProposalButton.tsx` (do plano anterior) — passar `proposal.product_id` ao hook.
- Outros consumidores de `useTemplatesWithOverrides` no Kanban / LeadDrawer — passar `productId` quando disponível.

---

### Critério de aceite
- Admin consegue criar/editar template marcando-o como **Global** ou vinculado a um produto.
- Templates atuais continuam aparecendo em todos os contextos (porque ficam `NULL`).
- Ao abrir o seletor de templates dentro de uma proposta de produto X:
  - aparecem **só** os templates de X + os globais.
  - templates de outros produtos ficam ocultos.
- Overrides do usuário continuam funcionando exatamente como hoje.
- Nenhum impacto em geração de PDF, fluxo de status de proposta ou envio de e-mail via Gmail.


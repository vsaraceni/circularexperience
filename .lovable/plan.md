

## Avaliação da implementação atual + o que falta

### O que JÁ está implementado e funcionando
1. **Schema** — `message_templates.product_id` (uuid, nullable) com FK para `products` e index `(stage, product_id)`. ✅
2. **Central de Templates (`/admin/templates`)** — admin pode criar/editar marcando como **Global** ou vinculado a um produto, filtrar por produto, e cada card mostra um chip `Global` ou nome do produto. ✅
3. **Hook `useTemplatesWithOverrides(stage, userId, productId?)`** — filtra `product_id IS NULL OR product_id = ?` e ordena produto-específico antes do global. ✅
4. **LeadDrawer (Pipeline)** — resolve o `product_id` da proposta mais recente do lead via query `lead_product_id` e passa para o hook. O popover de mensagens já recebe templates filtrados pelo produto do lead. ✅

### Onde está o "buraco" (por que você não vê o vínculo)
Na tela **`/admin/propostas`** (rascunhos/enviadas/etc.) **não há nenhum botão que use os templates**. O plano anterior previa um componente `SendProposalButton` (botão "Enviar Proposta" no card que abre Gmail pré-preenchido com template do produto). Esse arquivo **nunca foi criado** — busca global por `SendProposalButton` retorna zero matches.

Por isso a "vinculação template↔produto" parece invisível: ela está pronta no backend e na UI de gestão, mas o **consumidor principal** (botão de envio dentro de uma proposta com produto conhecido) não existe.

### Plano para fechar o ciclo

#### 1) Criar `src/components/admin/SendProposalButton.tsx`
- Recebe `proposal: Proposal` por props (a `Proposal` já tem `product_id` e `lead_id`).
- Carrega lead vinculado (email, name, company, cargo, assigned_to) e profile do specialist.
- Chama `useTemplatesWithOverrides("proposta", userId, proposal.product_id)` — **aqui o filtro por produto finalmente é exercido na tela de Propostas**.
- Se houver mais de um template ativo, abre Popover agrupado em duas seções:
  - **"Para este produto"** (templates com `product_id === proposal.product_id`)
  - **"Geral"** (templates `product_id NULL`)
- Aplica `replaceVariables(...)` com `data_envio_proposta = hoje (dd/MM/yyyy)`.
- Abre Gmail Web: `https://mail.google.com/mail/?view=cm&to={email}&su={subject}&body={body}` em nova aba.
- Registra activity `proposta_enviada_email` em `lead_activities` com título do template usado.
- Toast: "Gmail aberto. Anexe o PDF antes de enviar." + ação rápida "Marcar como Enviada" → `onStatusChange(p.id, "enviada")`.

Tratamento de erros:
- Sem `lead_id`/`email` → toast "Esta proposta não tem lead/email associado."
- Sem template ativo de proposta para o produto + sem global → toast "Nenhum template de e-mail configurado para o estágio Proposta."

#### 2) Integrar em `src/components/admin/ProposalList.tsx`
- Adicionar `<SendProposalButton proposal={p} onStatusChange={onStatusChange} />` ao lado do `<PdfExporter />`.
- Ícone `Send` (já importado no arquivo). Tooltip: "Enviar por e-mail (Gmail) usando template do produto".

#### 3) Validação visual rápida da feature já implementada
Após o item 1+2, ao abrir uma proposta vinculada ao produto X:
- O popover de envio mostra primeiro os templates de X, depois os globais.
- Templates de outros produtos ficam ocultos.
- Isso confirma na prática que toda a cadeia (schema → hook → UI) funciona ponta a ponta.

### O que NÃO muda
- Geração de PDF, fluxo de status de proposta, schema, RLS, edge functions, overrides por usuário — tudo intacto.

### Arquivos impactados
- **Novo**: `src/components/admin/SendProposalButton.tsx`
- **Edit**: `src/components/admin/ProposalList.tsx` (adicionar botão)

### Critério de aceite
- Em `/admin/propostas`, cada card tem um botão "Enviar Proposta".
- Clique abre Gmail com destinatário + assunto + corpo já renderizados.
- Lista de templates respeita o `product_id` da proposta (produto-específico em destaque, globais embaixo).
- Activity registrada no histórico do lead.
- Templates de outros produtos não aparecem.


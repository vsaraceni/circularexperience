

## Correção da contagem de leads + Variáveis de personalização no email em massa

### Problema 1 — Contagem errada (117 em vez de 8)

O `BulkEmailDialog` recebe `filteredLeads` corretamente (a prop `leads` vem do `filteredLeads` do Pipeline). Porém, o dialog filtra internamente com `eligibleLeads` removendo `perdido` e `fechado`. Como os 117 leads ativos não incluem perdido/fechado, o filtro interno não reduz nada — ele mostra 117 porque o `filteredLeads` que chega já tem 117 items.

**Causa raiz:** O botão "Enviar email em massa" só aparece no menu `⋮` global, que renderiza o `BulkEmailDialog` com `filteredLeads` antes dos filtros de estágio/tier serem aplicados — ou seja, `filteredLeads` está correto no `useMemo`, mas o problema pode estar em que a opção de bulk email também está disponível no modo Kanban (onde `filteredLeads` inclui todos os estágios). Revisando o código: o menu item só aparece quando `viewMode === "priorities"`, e o `filteredLeads` inclui os filtros de `filterStages` e `filterTier`. Se o screenshot mostra 8 leads com filtros ativos mas o dialog mostra 117, pode ser um bug de timing/state.

**Solução:** O dialog deve mostrar exatamente a contagem dos leads recebidos (sem re-filtrar). Remover o filtro interno `eligibleLeads` e confiar no `filteredLeads` já filtrado. Na toolbar, a contagem já é precisa. A questão real é que o slug do template usado para `from_email` está errado (`welcome` em vez de `lead-welcome`).

### Problema 2 — Variáveis de personalização

O email de boas-vindas suporta `{{name}}`, `{{full_name}}`, `{{email}}`, `{{company}}`, `{{cargo}}`, `{{sender_name}}`, `{{sender_email}}`, `{{sender_phone}}`. O bulk email atual envia o `body_html` cru sem substituir variáveis — todos recebem o mesmo texto.

---

### Implementação

**1. BulkEmailDialog — Corrigir contagem e adicionar variáveis**

- Remover o filtro interno `eligibleLeads` — usar `leads` diretamente (já vem filtrado do Pipeline)
- Adicionar seção de variáveis clicáveis (badges) idêntica à do EmailTemplateEditor:
  - `{{name}}` — Primeiro nome
  - `{{full_name}}` — Nome completo
  - `{{email}}` — Email do lead
  - `{{company}}` — Empresa
  - `{{cargo}}` — Cargo
- Clicar na badge copia a variável para clipboard
- Adicionar nota explicativa: "Variáveis são substituídas automaticamente para cada lead"

**2. Edge Function `send-bulk-email` — Substituir variáveis por lead**

- Expandir o SELECT para incluir `cargo`: `"id, name, email, company, cargo"`
- Antes de enviar cada email, aplicar `replacePlaceholders` no `subject` e `body_html`:
  - `{{name}}` → primeiro nome
  - `{{full_name}}` → nome completo
  - `{{email}}` → email
  - `{{company}}` → empresa
  - `{{cargo}}` → cargo
- Corrigir o slug do template de `welcome` para `lead-welcome` na busca do `from_email`/`from_name`
- Buscar também o perfil do admin (sender) para variáveis `{{sender_name}}`, `{{sender_email}}`, `{{sender_phone}}`

**3. Assunto também suporta variáveis** — O `subject` passa pelo mesmo `replacePlaceholders` por lead

---

### Arquivos impactados

| Arquivo | Mudança |
|---|---|
| `src/components/admin/BulkEmailDialog.tsx` | Remover filtro `eligibleLeads`, usar `leads` direto; adicionar badges de variáveis |
| `supabase/functions/send-bulk-email/index.ts` | Adicionar `replacePlaceholders` por lead; expandir SELECT; corrigir slug; buscar perfil do admin |




## Plano: Exibir campo "mensagem" no CRM

### 1. Interface `Lead` (LeadList.tsx)
- Adicionar `mensagem?: string | null` à interface `Lead`.

### 2. Badge indicativo na lista (LeadList.tsx)
- Quando `lead.mensagem` tiver texto (não vazio/null), exibir um badge "Mensagem" com ícone `MessageSquare` na linha de badges do card, indicando visualmente que há uma mensagem a ser lida.

### 3. Formulário de edição (LeadEditDialog.tsx)
- Adicionar campo `mensagem` ao estado do form e ao `useEffect` que carrega os dados.
- Exibir um `Textarea` (read-write) com label "Mensagem" no dialog de edição.
- Incluir `mensagem` no `update` do Supabase ao salvar.

### Nenhuma migração necessária
O campo `mensagem` já existe na tabela `leads` (text, nullable, default `''`).


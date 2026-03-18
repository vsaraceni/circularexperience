

## Plano: Editar Lead, Arquivar Lead, CC + Assinatura Dinâmica no Welcome Email

### 1. Botão "Editar Lead" — Modal de edição no CRM

- Criar componente `LeadEditDialog.tsx` com um Dialog/Sheet contendo form para editar: nome, email, cargo, empresa, telefone, origem, status.
- Ao salvar, faz `supabase.from("leads").update(...)` e chama `onLeadUpdated()`.
- No `LeadList.tsx`, adicionar botão com ícone de lápis (Pencil) que abre o dialog.

### 2. Botão "Arquivar Lead"

- Adicionar botão com ícone Archive no card do lead.
- Ao clicar, atualiza o status do lead para `"archived"` via `supabase.from("leads").update({ status: "archived" })`.
- Confirmar com dialog simples antes de arquivar.
- Como a query atual usa `.neq("status", "converted")`, precisamos também filtrar `archived`: trocar para `.not("status", "in", '("converted","archived")')` em `Proposals.tsx`.

### 3. Welcome email com CC para o admin logado + assinatura dinâmica

**Frontend (`LeadList.tsx`):**
- O `handleSendWelcome` passa dados do admin logado (nome, email, telefone) no body da chamada à Edge Function.
- O componente receberá `authorDefaults` como prop (já disponível em `Proposals.tsx`).

**Edge Function (`send-welcome-email`):**
- Aceitar novos campos opcionais: `sender_name`, `sender_email`, `sender_phone`.
- Adicionar `cc: [sender_email]` nas opções do Resend (quando `sender_email` presente).
- Adicionar placeholders ao template: `{{sender_name}}`, `{{sender_email}}`, `{{sender_phone}}` — para uso na assinatura do HTML.
- O template `lead-welcome` no banco deverá incluir bloco de assinatura com esses placeholders (o admin pode personalizar via editor existente).

### Resumo de arquivos

| Arquivo | Mudança |
|---|---|
| `src/components/admin/LeadEditDialog.tsx` | Criar — modal de edição de lead |
| `src/components/admin/LeadList.tsx` | Adicionar botões Editar/Arquivar, passar dados do admin no welcome |
| `src/pages/admin/Proposals.tsx` | Filtrar leads arquivados, passar `authorDefaults` ao `LeadList` |
| `supabase/functions/send-welcome-email/index.ts` | Aceitar dados do remetente, adicionar CC e placeholders de assinatura |




## Problema

Leads vindos de fontes externas (inseridos diretamente no banco) não passam pela Edge Function `send-lead-email`, então nunca recebem o e-mail de boas-vindas. Precisamos de duas soluções: automática e manual.

---

## Solução

### 1. Envio manual individual (botão no CRM)

Adicionar um botão "Enviar Boas-Vindas" em cada card de lead no `LeadList.tsx`. Ao clicar, o admin dispara o envio do e-mail de boas-vindas para aquele lead específico.

**Implementação:**

- **Nova Edge Function `send-welcome-email`**: Recebe `{ name, email, company, cargo }`, busca o template `lead-welcome` no banco, substitui os placeholders e envia via Resend. Reutiliza a mesma lógica que já existe em `send-lead-email`, mas isolada apenas para o envio do welcome.
- **`LeadList.tsx`**: Adicionar botão com ícone de e-mail ao lado do botão "Gerar Proposta". Ao clicar, chama `supabase.functions.invoke("send-welcome-email", { body: leadData })`. Exibe toast de sucesso/erro.

### 2. Envio automático via Database Trigger

Criar um trigger no banco que dispara automaticamente quando um novo lead é inserido na tabela `leads` — independente da origem.

**Implementação:**

- **Database Webhook / pg_net**: Criar uma função SQL + trigger `AFTER INSERT ON leads` que chama a Edge Function `send-welcome-email` via `pg_net` (HTTP request assíncrono). Assim, qualquer INSERT — seja da LP, API externa ou manual — dispara o welcome email.
- **Ajuste em `send-lead-email`**: Remover o bloco de envio do welcome email dessa função (pois o trigger já cuidará disso), mantendo apenas a notificação interna.

### 3. Controle de envio duplicado

- Adicionar coluna `welcome_sent` (boolean, default `false`) na tabela `leads`.
- O trigger e o botão manual verificam esse campo antes de enviar — evitando duplicidade.
- O botão manual fica desabilitado/oculto para leads que já receberam o e-mail.

---

## Resumo das mudanças

| Artefato | Ação |
|---|---|
| Tabela `leads` | Adicionar coluna `welcome_sent boolean default false` |
| Edge Function `send-welcome-email` | Criar — envia welcome email e marca `welcome_sent = true` |
| Edge Function `send-lead-email` | Remover bloco de welcome (evitar duplicidade) |
| DB Trigger `on_lead_insert` | Criar — chama `send-welcome-email` via `pg_net` |
| `supabase/config.toml` | Adicionar `verify_jwt = false` para `send-welcome-email` |
| `LeadList.tsx` | Adicionar botão "Enviar Boas-Vindas" com estado baseado em `welcome_sent` |
| `Lead` interface | Adicionar campo `welcome_sent` |


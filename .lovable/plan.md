

## Plano: Adicionar data de envio do welcome email

Registrar a data/hora do envio do e-mail de boas-vindas e exibi-la no badge do CRM.

### 1. Migração: nova coluna `welcome_sent_at`
- Adicionar coluna `welcome_sent_at timestamptz` na tabela `leads` (nullable, default null).

### 2. Edge Function `send-welcome-email`
- Além de `welcome_sent: true`, gravar `welcome_sent_at: new Date().toISOString()` no update do lead.

### 3. UI `LeadList.tsx`
- Atualizar interface `Lead` com `welcome_sent_at?: string`.
- No badge "Welcome enviado", mostrar a data formatada: `Welcome enviado em DD/MM/AAAA`.

### 4. Tipos
- O arquivo `types.ts` será atualizado automaticamente após a migração.


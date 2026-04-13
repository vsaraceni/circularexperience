

## Fix: Remetente e Reply-To no Email em Massa

### Problema
O campo `from` usa `fromName` vindo da tabela `email_templates` (slug `lead-welcome`), que contém o texto literal `{{sender}}` ou um nome genérico. O email chega com remetente "{{sender}}" em vez do nome do usuário logado. Além disso, não há `reply_to`, então o destinatário não consegue responder diretamente ao remetente.

### Solução

No `supabase/functions/send-bulk-email/index.ts`:

1. **Remetente = nome do usuário logado**: Substituir `fromName` pelo `sender.full_name` (já carregado do profile na linha 121-131). Manter o `fromEmail` do template (domínio verificado).

2. **Adicionar `reply_to`**: Incluir `reply_to: sender.email` (email do profile do usuário logado) no payload do Resend, para que respostas vão direto para o remetente.

**Mudança concreta** (linhas 170-175):
```typescript
body: JSON.stringify({
  from: `${sender.full_name || fromName} <${fromEmail}>`,
  to: [lead.email],
  reply_to: sender.email,
  subject: personalizedSubject,
  html: personalizedBody,
}),
```

### Arquivo impactado

| Arquivo | Mudança |
|---|---|
| `supabase/functions/send-bulk-email/index.ts` | `from` usa `sender.full_name`, adiciona `reply_to: sender.email` |

Requer redeploy da Edge Function.


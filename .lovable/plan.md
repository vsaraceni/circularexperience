

## Diagnóstico: Emails retornando 401 (JWT inválido)

### Problema encontrado

Nos logs, **todas** as chamadas a `send-transactional-email` estão retornando **401 Invalid JWT**:

```text
POST | 401 | send-transactional-email (5 chamadas consecutivas)
```

A `email_send_log` está vazia — nenhum email sequer chegou a ser processado.

### Causa raiz

A edge function `check-notifications` cria um client Supabase com `SUPABASE_SERVICE_ROLE_KEY` e chama `supabase.functions.invoke("send-transactional-email")`. Porém, no runtime do Deno, o `functions.invoke()` usa o header de autorização do contexto original da requisição (o anon key do cron job), não o service role key passado ao `createClient`. Como `send-transactional-email` tem `verify_jwt = true` no `config.toml`, a chamada é rejeitada.

### Solução

Alterar `verify_jwt` para `false` em `send-transactional-email` no `supabase/config.toml`. Isso é seguro porque:
- A função já valida seus próprios inputs (template, recipient, etc.)
- A fila de email já usa service role key para autenticação
- É o mesmo padrão usado por `process-email-queue` e outras functions do sistema

### Arquivo afetado

| Arquivo | Mudança |
|---------|---------|
| `supabase/config.toml` | `verify_jwt = false` para `send-transactional-email` |

Após a mudança, fazer redeploy da function e disparar um teste para confirmar que o email chega.


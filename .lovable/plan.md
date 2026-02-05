
# Plano: Alterar Destinatário do Email do Formulário

## Resumo
Alterar o endereço de destino (campo `to`) na edge function `send-lead-email` para enviar os emails para o novo endereço de contato.

## Alteração Necessária

**Arquivo:** `supabase/functions/send-lead-email/index.ts`

**Localização:** Linha 39

**De:**
```typescript
to: ["contato@circularexperience.com.br"],
```

**Para:**
```typescript
to: ["contato@movimentocircular.io"],
```

## Justificativa
O novo endereço `contato@movimentocircular.io` será o destinatário de todas as inscrições enviadas através do formulário de leads.

## Resultado Esperado
Após esta alteração, todos os emails de inscrição do formulário serão entregues no novo endereço de email da Movimento Circular.

## Arquivos Afetados
- `supabase/functions/send-lead-email/index.ts` (linha 39)


# Plano: Atualizar Domínio de Envio de Email

## Resumo
Atualizar o endereço de envio (campo `from`) na edge function `send-lead-email` para utilizar o domínio verificado `lovable.movimentocircular.io`.

## Alteração Necessária

**Arquivo:** `supabase/functions/send-lead-email/index.ts`

**Localização:** Linha 40

**De:**
```typescript
from: "Circular Experience <onboarding@resend.dev>",
```

**Para:**
```typescript
from: "Circular Experience <contato@lovable.movimentocircular.io>",
```

## Justificativa
O domínio `lovable.movimentocircular.io` está verificado no Resend, permitindo enviar emails para qualquer endereço de destino (neste caso, `contato@circularexperience.com.br`). Isso resolve o erro anterior que permitia apenas enviar para o email do proprietário da conta.

## Resultado Esperado
Após esta alteração, o formulário enviará emails com sucesso através do domínio verificado, e os leads receberão a mensagem normalmente.

## Arquivos Afetados
- `supabase/functions/send-lead-email/index.ts` (linha 40)

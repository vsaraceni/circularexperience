
## Objetivo

Garantir que todo telefone — novo ou existente — fique salvo no formato E.164:
`+<país><DDD><número>` (ex.: `+5531997246145`). Padrão de país: Brasil (`+55`).

## Como vamos garantir

### 1. Função única de normalização (`toE164`)

Criar um utilitário compartilhado (frontend e edge functions) com a regra:

- Remove tudo que não for dígito (mantendo o `+` inicial se houver).
- Se começa com `+`, mantém o código de país informado.
- Se tem 10 ou 11 dígitos (DDD + número BR), prefixa `55`.
- Se tem 12 ou 13 dígitos e começa com `55`, considera já BR completo.
- Se tem 8 ou 9 dígitos (sem DDD), rejeita pedindo DDD.
- Resultado final sempre: `+` seguido de 11 a 15 dígitos.
- Retorna `{ ok, value, error }` para ser usado tanto na UI quanto na ingestão.

Validação via zod: `/^\+\d{11,15}$/`.

### 2. Entrada de dados — todos os pontos cobertos

Aplicar `toE164` em:

- `supabase/functions/ingest-lead` — substituir `normalizePhone` (que hoje só tira não-dígitos) pela nova função; rejeitar com `invalid` se telefone vier mas não for normalizável.
- `src/components/admin/LeadEditDialog.tsx` — normaliza no `onBlur` e ao salvar; mostra erro inline se inválido.
- `src/components/admin/LeadDrawer.tsx` (edição inline do campo telefone) — mesmo tratamento no save.
- Webhook Meta Leads (`webhook-meta-leads`) — passa pelo `toE164` antes de inserir.
- Formulário de contato público se houver (verificar `ContactDialog.tsx`).

UX: o input continua livre, mas ao perder o foco mostramos o valor formatado em E.164. Placeholder: `+55 31 99724-6145`.

### 3. Backend — defesa em profundidade

Migration adicionando:

- **Trigger de validação** em `leads` (BEFORE INSERT/UPDATE): se `telefone` não for `NULL`/vazio e não casar com `^\+\d{11,15}$`, tenta normalizar via função SQL `public.normalize_phone_e164(text)`; se ainda assim falhar, lança erro.
- **Função SQL** `normalize_phone_e164(text)` espelhando a regra do TS (mesma lógica BR-first).
- Não usamos CHECK constraint (seguindo a regra do projeto: triggers em vez de CHECK quando há lógica não-imutável/normalizadora).

### 4. Backfill dos dados atuais

Script SQL único na migration:

```
UPDATE leads
SET telefone = public.normalize_phone_e164(telefone)
WHERE telefone IS NOT NULL
  AND telefone <> ''
  AND telefone !~ '^\+\d{11,15}$';
```

Telefones que não conseguirem ser normalizados (ex.: só "---" ou número curto demais) ficam como `NULL` e são listados num log `lead_activities` do tipo `telefone_invalido` para revisão manual.

### 5. WhatsApp e CAPI continuam funcionando

Como agora o telefone já está em E.164, podemos simplificar:

- `wa.me/${telefone.replace(/\D/g,'')}` continua válido.
- `send-whatsapp-gptmaker` e `send-meta-capi-event` recebem o número limpo de forma consistente (sem mais "(68) 99232-8932" ou "p:+55…").

## Resumo dos arquivos

- novo: `src/lib/phone.ts` (com testes em `src/test/phone.test.ts`)
- novo: `supabase/functions/_shared/phone.ts`
- editado: `supabase/functions/_shared/normalize.ts` (delega para `phone.ts`)
- editado: `supabase/functions/ingest-lead/index.ts`, `webhook-meta-leads/index.ts`
- editado: `src/components/admin/LeadEditDialog.tsx`, `LeadDrawer.tsx`, `ContactDialog.tsx` (se aplicável)
- nova migration: função `normalize_phone_e164` + trigger em `leads` + backfill

## Pergunta rápida

Confirmando: padrão é **Brasil (+55)** quando o número vier sem código de país, certo? Se um lead vier com DDI explícito (ex.: `+1...`, `+351...`), respeitamos esse DDI.

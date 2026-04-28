## Refatoração estruturada do `ingest-lead`

A função `ingest-lead` que criamos na rodada anterior funciona, mas está toda em 2 arquivos e usa SHA-256 para a API key. O prompt enviado define uma versão mais robusta: módulos compartilhados em `_shared/`, **bcrypt** para hash da chave, header renomeado, criação de activity, disparo de email interno e testes em Vitest. Este plano migra a implementação atual para esse desenho.

---

### Pontos de atenção a decidir antes de implementar

1. **bcrypt no Deno** — o prompt importa `bcrypt@5.1.1` de `esm.sh`. Esse pacote npm depende de bindings nativos C++ e **não roda em Deno Edge Functions**. Vou substituir por `https://deno.land/x/bcrypt@v0.4.1/mod.ts` (porting puro JS, compatível). API (`compare(raw, hash)`) é a mesma — sem impacto no resto do código.

2. **Header `x-mc-api-key`** — substitui `x-api-key` atual. Quem já estiver chamando a função (ninguém em produção ainda, é nova) precisa atualizar. Vou aceitar **os dois headers** durante uma janela curta? Ou cortar direto?
   → Proposta: **cortar direto**, função ainda não tem clientes externos.

3. **Template `novo-lead-interno`** — não existe no registry (`supabase/functions/_shared/transactional-email-templates/registry.ts`). Sem ele, a chamada falha silenciosamente (já está em `EdgeRuntime.waitUntil` com `.catch`). Duas opções:
   - **(a)** Criar o template agora, simples (assunto: "Novo lead: {{lead_company}} — {{lead_name}}"), com os campos do payload.
   - **(b)** Deixar o code path pronto mas **comentado** até a equipe definir o template.
   → Proposta default: **(a)** criar o template básico.

4. **Hashes da migration** — o prompt traz 3 hashes bcrypt já gerados para `meta_ads`, `lp_ce`, `manual`. Esses hashes correspondem a **chaves específicas que só você (usuário) tem em mãos**. Vou aplicar a migration exatamente como veio. Se as 3 sources ainda não existem em `lead_sources`, a migration faz `UPDATE` zero linhas — preciso confirmar se já estão cadastradas (eu verifico no momento da execução e crio se faltar).

5. **UI admin para gerenciar API keys** — você mencionou isso na rodada anterior. **Não está neste prompt**. Mantenho fora desta entrega; abro como próximo passo.

---

### Mudanças, em ordem

**1. Criar módulos `_shared/`**

Novo diretório `supabase/functions/_shared/` (não-transactional-email-templates):

- `_shared/ingest-types.ts` — Zod schema + interfaces `LeadSource`, `IngestStatus`, `IngestResult`.
- `_shared/normalize.ts` — `normalizeEmail`, `normalizePhone`, `pickClientIp` (xff → cf-connecting-ip → x-real-ip), `pickUserAgent`, `payloadHash` (SHA-256 hex do body cru, só para log/auditoria).
- `_shared/auth.ts` — `authenticateApiKey(supabase, rawKey)` usando **bcrypt do deno.land/x**, classe `AuthError`, função `checkCors(req, source)`.
- `_shared/rate-limit.ts` — `checkRateLimit(supabase, sourceSlug, limitPerMin)` com fail-open se a query falhar.
- `_shared/dedupe.ts` — `findDuplicate` com estratégia **forte** (origem + source_id, sem janela) e **branda** (origem + email lowercase, janela 24h).

**2. Reescrever `supabase/functions/ingest-lead/index.ts`**

Pipeline em 11 etapas: read body → hash → auth → CORS → rate-limit → parse JSON → validate Zod → checa `payload.source === source.slug` (senão 403 source mismatch) → normalize → dedupe → insert lead → insert `lead_activities` (`activity_type='lead_recebido'`) → CAPI condicional via `supabase.functions.invoke` em `EdgeRuntime.waitUntil` → email interno via `send-transactional-email` se `source.email_notificar` não vazio → log final.

**3. Remover arquivos antigos**

- Apaga `supabase/functions/ingest-lead/schema.ts` (substituído por `_shared/ingest-types.ts`).
- Apaga `supabase/functions/ingest-lead/schema_test.ts` (testes migram pra Vitest).

**4. Aplicar migration SQL**

Atualiza `api_key_hash` em `lead_sources` para `meta_ads`, `lp_ce`, `manual` com os 3 hashes bcrypt do prompt. Antes de aplicar eu **verifico** se as 3 sources existem; se faltar alguma, eu confirmo com você antes de criar.

**5. `config.toml`**

Já tem `[functions.ingest-lead] verify_jwt = false` da rodada anterior. Sem alteração.

**6. Template transacional `novo-lead-interno`** *(opção a)*

Cria `supabase/functions/_shared/transactional-email-templates/novo-lead-interno.tsx` e registra em `registry.ts`. Campos: `lead_name`, `lead_email`, `lead_company`, `lead_cargo`, `lead_telefone`, `source_nome`, `custom_fields`. Layout simples no padrão dos outros templates.

**7. Testes Vitest**

Cria `src/test/ingest-lead.test.ts` com:
- `ingestPayloadSchema`: aceita mínimo, rejeita email inválido, rejeita name vazio, aceita utm + custom_fields, rejeita source ausente.
- `normalize`: lowercase+trim email, dígitos do telefone, null para vazio/abc, `pickClientIp` xff > cf-connecting-ip.
- `findDuplicate` com mock do supabase: match forte por source_id, match brando por email, sem match.

Os testes importam de `supabase/functions/_shared/*` — preciso confirmar que `vitest.config.ts` permite essa resolução (Vite normalmente resolve qualquer caminho relativo, então deve funcionar; valido na hora).

**8. Deploy + smoke test**

Deploy via tool, depois `curl` na função com uma das chaves cruas (você me passa em PM ou eu uso uma chave de teste) para validar:
- 401 sem header
- 401 com header inválido
- 201 + lead_id com payload válido
- 200 + status="duplicate" no segundo POST com mesmo email/source dentro de 24h

---

### Arquivos tocados

```text
+ supabase/functions/_shared/ingest-types.ts        (novo)
+ supabase/functions/_shared/normalize.ts           (novo)
+ supabase/functions/_shared/auth.ts                (novo, bcrypt deno.land/x)
+ supabase/functions/_shared/rate-limit.ts          (novo)
+ supabase/functions/_shared/dedupe.ts              (novo)
~ supabase/functions/ingest-lead/index.ts           (reescrito)
- supabase/functions/ingest-lead/schema.ts          (removido)
- supabase/functions/ingest-lead/schema_test.ts     (removido)
+ supabase/functions/_shared/transactional-email-templates/novo-lead-interno.tsx  (novo, opção a)
~ supabase/functions/_shared/transactional-email-templates/registry.ts            (registra novo template)
+ src/test/ingest-lead.test.ts                      (novo, Vitest)
~ migration: UPDATE lead_sources SET api_key_hash WHERE slug IN ('meta_ads','lp_ce','manual')
```

---

### Decisões pendentes (peço aprovação na confirmação do plano)

- **bcrypt**: confirmo trocar `esm.sh/bcrypt` por `deno.land/x/bcrypt` (única forma que roda no Deno Edge).
- **Template `novo-lead-interno`**: crio agora (a) ou deixo code path em standby (b)?
- **UI admin para gerar/listar/rotacionar API keys**: mantenho fora desta entrega (abre na próxima).

Se aprovar tudo com defaults (bcrypt deno.land, template criado, sem UI nesta rodada), eu sigo direto.
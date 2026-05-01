## Objetivo

1. **Enriquecer automaticamente** todo lead novo (sem clique manual).
2. **Mostrar resultado** já preenchido no drawer (sem mudança visual — já mostra quando existe).
3. **Sugerir tier** combinando colaboradores declarados + sinais do enriquecimento (empresa global/multinacional/bilionária pode virar Tier 1 mesmo com 50 funcionários no BR).

## 1. Enriquecimento automático na chegada do lead

**Onde disparar:**

- **`supabase/functions/ingest-lead/index.ts`** — após criar o lead (perto da linha 365, junto do bloco WhatsApp), invocar `enrich-lead` em `EdgeRuntime.waitUntil(...)` para não bloquear a resposta.
- **`src/pages/admin/Pipeline.tsx`** e **`src/pages/admin/Proposals.tsx`** — após `insert` manual de lead, chamar `supabase.functions.invoke("enrich-lead", { body: { lead_id, user_id } })` em fire-and-forget (sem await bloqueante na UI).

Não disparar para domínios de teste (`@atinaedu.com.br`, `@movimentocircular.io`) nem se já existir `company_description`.

**Idempotência:** `enrich-lead` já sobrescreve com base em `lead_id`. Adicionar guard simples no início da função: se `company_description` já preenchido **e** `req.body.force !== true`, retornar 200 com `{ skipped: true }`.

## 2. Sugestão de tier

**Onde:** dentro de `enrich-lead/index.ts`, depois que a IA gera a descrição.

**Lógica:** segunda chamada à IA (Gemini Flash via Lovable AI) com structured output (tool calling) pedindo um JSON:

```json
{
  "suggested_tier": 1 | 2 | 3,
  "reasoning": "string curta",
  "signals": {
    "is_multinational": boolean,
    "is_global_brand": boolean,
    "estimated_global_revenue": "small|mid|large|enterprise|unknown",
    "estimated_global_headcount": "<100|100-1000|1000-10000|10000+|unknown"
  }
}
```

Prompt recebe: nome da empresa, `colaboradores` declarado, `cargo` do lead, descrição enriquecida. Regras embutidas no prompt:

- **Tier 1**: multinacional/global, presença bilionária, ou 500+ colaboradores globais — mesmo se a operação BR for pequena.
- **Tier 2**: empresa nacional média/grande (~100–500 colaboradores) ou regional consolidada.
- **Tier 3**: pequena empresa local, startup early-stage, ou empresa não identificada.

**Onde guardar:** novas colunas em `leads`:

- `suggested_tier` (int, nullable)
- `tier_reasoning` (text, nullable)
- `tier_signals` (jsonb, nullable)
- `tier_confirmed` (boolean default false) — vira `true` quando o usuário edita manualmente o tier no drawer (assim a sugestão da IA não sobrescreve depois).

Migração nova com essas colunas.

## 3. Exibir sugestão no drawer

Em **`src/components/admin/LeadDrawer.tsx`**, na linha do Tier (já editável):

- Se `lead.suggested_tier` existe e `tier_confirmed = false` e o tier atual diverge da sugestão:
  - Mostrar pequeno badge "Sugerido: Tier X" abaixo do select, com tooltip exibindo `tier_reasoning`.
  - Botão "Aplicar sugestão" que: atualiza `colaboradores` para o valor canônico do tier sugerido (mesma função `tierToColaboradores`) **e** marca `tier_confirmed = true`.
- Quando o usuário muda o tier manualmente no select, gravar também `tier_confirmed = true`.

A descrição da empresa (`company_description`) já aparece no card de Empresa — sem mudança visual ali, só passa a estar preenchida automaticamente.

## 4. Backfill (opcional, recomendado)

Botão admin "Enriquecer pendentes" não é necessário; mas para popular leads antigos: rodar uma vez via SQL/script disparando `enrich-lead` para todos com `company_description IS NULL OR suggested_tier IS NULL`. Posso fazer isso por insert tool em loop após o deploy, se você confirmar.

## Detalhes técnicos

**Arquivos editados:**

- `supabase/functions/enrich-lead/index.ts` — guard de idempotência + segunda chamada IA + update das novas colunas + log em `lead_activities` ("tier_sugerido").
- `supabase/functions/ingest-lead/index.ts` — invocar `enrich-lead` após criar o lead.
- `src/pages/admin/Pipeline.tsx` e `src/pages/admin/Proposals.tsx` — invocar `enrich-lead` após insert manual.
- `src/components/admin/LeadDrawer.tsx` — badge "Sugerido", botão "Aplicar", marcar `tier_confirmed`.
- `supabase/config.toml` — adicionar `[functions.enrich-lead]` com `verify_jwt = false` (para chamadas server-to-server do ingest).

**Migração:**

```sql
ALTER TABLE leads
  ADD COLUMN suggested_tier int,
  ADD COLUMN tier_reasoning text,
  ADD COLUMN tier_signals jsonb,
  ADD COLUMN tier_confirmed boolean NOT NULL DEFAULT false;
```

**Modelo IA:** `google/gemini-3-flash-preview` (já em uso no `enrich-lead`), com tool calling para garantir JSON válido.

**Custo/latência:** uma chamada extra de ~300 tokens por lead novo. Imperceptível no fluxo já assíncrono.

## Fora de escopo

- Não vou criar nova UI de "fila de enriquecimento".
- Não vou alterar a regra Tier 1/2/3 → `colaboradores` (continua a mesma — o tier sugerido só muda o valor canônico ao ser aplicado).
- Não vou adicionar fonte de dados externa nova além do Firecrawl que já é usado.
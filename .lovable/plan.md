## Confirmado

Você quer que email profissional vire o principal do CRM, com pessoal de backup em `custom_fields.personal_email`.

## Estado atual no banco

- 308 leads de `meta_ads` no total
- 145 já têm `work_email` ≠ `email` (versões antigas do webhook capturavam — esses ficam OK)
- 80 leads têm `fb_lead_id` mas `work_email` vazio/igual ao `email` → **dá pra refazer fetch na Graph API da Meta** e tentar recuperar
- 83 sem `fb_lead_id` (leads antigos pré-webhook) → não tem como puxar de volta, ficam como estão

## Plano

### 1. `webhook-meta-leads` — passar a capturar email profissional

Mapeamento estendido (cobre os slugs comuns que a Meta usa):

```ts
const personalEmail = fields["email"] || fields["e-mail"] || fields["email_address"] || "";
const workEmailRaw =
  fields["work_email"] ||
  fields["email_profissional"] ||
  fields["email_corporativo"] ||
  fields["email_de_trabalho"] ||
  fields["email_trabalho"] ||
  fields["company_email"] ||
  fields["business_email"] ||
  fields["e-mail_profissional"] ||
  fields["e-mail_corporativo"] ||
  "";

const email = workEmailRaw || personalEmail;          // principal vira o profissional
const work_email = workEmailRaw || null;              // coluna dedicada
const personal_email = personalEmail && personalEmail !== email ? personalEmail : null;
```

No insert: salvo `email`, `work_email`, e `custom_fields = { personal_email }`.

Adiciono `console.log("Meta fields keys:", Object.keys(fields))` para descobrir o slug real caso a Meta use outro (ajuste rápido depois).

### 2. UI — campo "Email profissional"

`LeadDrawer.tsx` e `LeadEditDialog.tsx`: adiciono linha "Email profissional" linkada a `work_email`, com mesmo padrão `EditableField`. Tooltip pequeno explicando que esse é o que entra em propostas/CAPI/welcome.

### 3. Backfill em duas frentes

#### 3a. Refetch via Graph API (recupera os 80 com `fb_lead_id`)

Crio edge function nova `backfill-meta-work-email`:

```ts
// Para cada lead onde origem='meta_ads' AND fb_lead_id IS NOT NULL
//   AND (work_email IS NULL OR work_email = '' OR work_email = email)
// Chama Graph API com META_ACCESS_TOKEN (mesmo que o webhook usa)
// Re-aplica a lógica de mapeamento → faz UPDATE: email, work_email, custom_fields.personal_email
```

A função roda em batch (50 por vez, com `?from_id=cursor`), é chamada uma vez por mim depois do deploy. Logs detalhados pra você acompanhar quantos foram recuperados.

Aviso: a Meta às vezes expira leads antigos (>90 dias) e o fetch retorna 400. Nesses casos eu logo "stale_lead" e sigo. Não bloqueia.

#### 3b. Migration SQL — promover work_email já existente

Para os 145 leads que já têm `work_email` ≠ `email` (capturado em versões antigas), troco o principal:

```sql
UPDATE public.leads
SET 
  custom_fields = jsonb_set(COALESCE(custom_fields,'{}'::jsonb), '{personal_email}', to_jsonb(email)),
  email = work_email
WHERE origem = 'meta_ads'
  AND work_email IS NOT NULL
  AND work_email <> ''
  AND work_email <> email
  AND split_part(lower(email), '@', 2) IN (
    'gmail.com','googlemail.com','hotmail.com','outlook.com','outlook.com.br',
    'yahoo.com','yahoo.com.br','live.com','icloud.com','aol.com',
    'hotmail.com.br','uol.com.br','bol.com.br','terra.com.br','ig.com.br','globo.com','msn.com'
  );
```

Só promove quando o email atual é genérico (gmail, hotmail etc.) — protege os 80 leads onde já está corporativo.

### 4. Sem mudança de schema

Coluna `work_email` já existe. Sem trigger novo.

## Resumo dos arquivos

- editado: `supabase/functions/webhook-meta-leads/index.ts` (mapeamento + log + insert)
- nova: `supabase/functions/backfill-meta-work-email/index.ts` (refetch dos 80 leads via Graph API)
- editado: `src/components/admin/LeadDrawer.tsx`, `LeadEditDialog.tsx`
- nova migration: promove os 145 já capturados (UPDATE condicional)

## Ordem de execução

1. Aplicar migration (promove os 145 imediatamente)
2. Deploy do `webhook-meta-leads` corrigido
3. Deploy + invocar `backfill-meta-work-email` uma vez (recupera o que der dos 80)
4. Você dispara um lead de teste no formulário pra confirmar que o slug do campo profissional bate com algum dos que mapeei

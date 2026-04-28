## Objetivo

Rotacionar API key da `lp_ce`, validar o `ingest-lead` end-to-end com 4 cenários e confirmar efeitos colaterais (email interno, CAPI skip, activity log).

## Credenciais geradas (lp_ce)

- **Raw key (header `x-mc-api-key`):** `pk_lpce_OZ0-v2OErbMMDsyL8Afdi0X6AoricrWJ`
- **Hash bcrypt (banco):** `$2b$12$YlvvlI4Js3IeGRWtZ5br8ePO76P9AtD1wZq7TYGyUorr8h1bSgvy2`

⚠️ Salve a raw key num gerenciador agora — depois ela não fica em lugar nenhum.

## Etapas

### 1. Migration: atualizar hash da lp_ce

```sql
UPDATE lead_sources
SET api_key_hash = '$2b$12$YlvvlI4Js3IeGRWtZ5br8ePO76P9AtD1wZq7TYGyUorr8h1bSgvy2',
    api_key_prefix = 'pk_lpce_',
    updated_at = now()
WHERE slug = 'lp_ce';
```

(Confirmar que `api_key_prefix` bate com `rawKey.slice(0, 8)` = `pk_lpce_`.)

### 2. Smoke tests via `supabase--curl_edge_functions`

| # | Cenário | Header `x-mc-api-key` | `source` no body | `source_id` | Esperado |
|---|---------|----------------------|------------------|-------------|----------|
| A | Sucesso | raw key válida | `lp_ce` | `smoke-test-001` | `201 created` + `lead_id` |
| B | Duplicata | raw key válida | `lp_ce` | `smoke-test-001` | `200 duplicate` |
| C | Source mismatch | raw key válida (lp_ce) | `meta_ads` | — | `403 forbidden` |
| D | Auth inválida | `pk_lpce_invalidaaaaaaaa` | `lp_ce` | — | `401 invalid` |

Body padrão (Test A/B):
```json
{
  "source": "lp_ce",
  "source_id": "smoke-test-001",
  "name": "Teste Ingest",
  "email": "smoketest+ingest1@example.com",
  "company": "QA Corp",
  "cargo": "QA Lead",
  "telefone": "11987654321",
  "utm": { "source": "smoke", "medium": "curl" },
  "consent_marketing": true
}
```

### 3. Verificações no banco (`supabase--read_query`)

- `leads`: 1 registro com `origem='lp_ce'`, `source_id='smoke-test-001'`, `kanban_stage='novo'`, `ingest_ip` preenchido.
- `lead_activities`: linha `lead_recebido` com `metadata.source_slug='lp_ce'`.
- `lead_ingest_log`: 4 entradas (`created`, `duplicate`, `forbidden`, `invalid`).

### 4. Logs de side effects (`supabase--edge_function_logs`)

- `send-transactional-email`: template `novo-lead-interno` enviado pra `contato@movimentocircular.io`.
- `send-meta-capi-event`: resultado `skipped` (stage `novo` não está no STAGE_MAP).
- `ingest-lead`: ver logs dos 4 requests.

### 5. Limpeza (migration)

```sql
DELETE FROM lead_activities WHERE lead_id IN (SELECT id FROM leads WHERE source_id = 'smoke-test-001');
DELETE FROM leads WHERE source_id = 'smoke-test-001';
```

## Como você reproduz de fora

```bash
curl -X POST https://gxqrmxhpltfkkhhtqvmh.supabase.co/functions/v1/ingest-lead \
  -H "Content-Type: application/json" \
  -H "x-mc-api-key: pk_lpce_OZ0-v2OErbMMDsyL8Afdi0X6AoricrWJ" \
  -d '{"source":"lp_ce","name":"Fulano","email":"fulano@empresa.com","telefone":"11999999999"}'
```

## Riscos

- Email real disparado pra `contato@movimentocircular.io` (você confirmou que pode).
- Lead de teste deletado no passo 5 — não polui Kanban.
- Zero impacto sobre webhook Meta Ads e CAPI atual (canais separados).
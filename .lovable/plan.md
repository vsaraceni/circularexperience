

## Atualizar Apps Script para usar a Edge Function segura

### Problema
O script atual (linha 70) ainda chama `/rest/v1/vw_proposals_leads` com a `ANON_KEY`. Isso bate no RLS da tabela `leads` e retorna os campos do lead vazios. A Edge Function `export-proposals-leads` já está deployada e funcional, mas o script não foi atualizado para usá-la.

### Solução
Atualizar o Apps Script para:
1. Trocar a URL para a Edge Function (`/functions/v1/export-proposals-leads`)
2. Trocar a autenticação de `ANON_KEY` para o `PROPOSALS_EXPORT_TOKEN` via header `x-export-token`
3. Ajustar o parsing do JSON (a Edge Function retorna `{ data: [...], count: N }`, não um array direto)

### Mudanças no script

| Área | De | Para |
|------|-----|------|
| URL | `/rest/v1/vw_proposals_leads` | `/functions/v1/export-proposals-leads?limit=5000` |
| Auth header | `apikey` + `Authorization: Bearer ANON_KEY` | `x-export-token: TOKEN` |
| Paginação | Loop manual com offset | Parâmetro `limit=5000` (ou loop se necessário) |
| Parse response | `JSON.parse(response)` direto como array | `JSON.parse(response).data` |

### Arquivo gerado
Novo `/mnt/documents/apps_script_propostas_leads.js` com as correções aplicadas.


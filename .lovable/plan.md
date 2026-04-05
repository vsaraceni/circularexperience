

## Corrigir exportação CSV — dados do lead ausentes

### Diagnóstico
A VIEW `vw_proposals_leads` está correta no banco — todos os campos do lead (email, telefone, kanban_stage, origem, etc.) retornam dados. O problema foi exclusivamente no script de exportação que gerou o CSV original.

### Solução
Regenerar o CSV via `psql` direto, usando o JOIN completo com todas as colunas. Sem alteração na VIEW ou em código — apenas re-exportar.

### Ação

| Ação | Detalhe |
|------|---------|
| Script export | Novo CSV em `/mnt/documents/propostas_leads.csv` via `psql COPY` da view |


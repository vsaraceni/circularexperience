

## Limpar HTML dos campos de texto na VIEW

### Problema
Os campos `scope` e `considerations` da tabela `proposals` armazenam conteúdo em HTML (tags `<p>`, `<strong>`, `<ul>`, etc.). Na VIEW `vw_proposals_leads`, esses campos são exibidos com as tags, poluindo a planilha.

### Solução
Recriar a VIEW usando `regexp_replace` para remover todas as tags HTML e converter `&nbsp;` em espaço, resultando em texto limpo.

### Migração SQL

```sql
DROP VIEW IF EXISTS public.vw_proposals_leads;

CREATE VIEW public.vw_proposals_leads WITH (security_invoker = true) AS
SELECT
  -- campos existentes...
  regexp_replace(regexp_replace(p.scope, '<[^>]+>', '', 'g'), '&nbsp;', ' ', 'g') AS scope,
  regexp_replace(regexp_replace(p.considerations, '<[^>]+>', '', 'g'), '&nbsp;', ' ', 'g') AS considerations,
  -- demais campos...
```

Apenas `scope` e `considerations` serão limpos — os demais campos permanecem iguais.

### Arquivos afetados

| Ação | Detalhe |
|------|---------|
| Migração SQL | `DROP + CREATE VIEW` com `regexp_replace` nos campos HTML |
| Re-exportar CSV | Novo `/mnt/documents/propostas_leads.csv` com texto limpo |




## Plano: Adicionar campo "origem" à tabela leads

### Alterações

1. **Migração SQL** — Adicionar coluna `origem` à tabela `leads`:
```sql
ALTER TABLE public.leads ADD COLUMN origem text NOT NULL DEFAULT 'LP';
```
Todos os leads existentes receberão `'LP'` automaticamente.

2. **Edge Function `send-lead-email/index.ts`** — Incluir `origem: 'LP'` no insert do lead (explícito).

3. **Frontend `LeadList.tsx`** — Exibir o campo origem na listagem de leads no CRM.


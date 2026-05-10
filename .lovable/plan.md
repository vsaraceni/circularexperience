## Mudança de schema na tabela `leads`

Adicionar duas colunas, sem tocar em nada mais.

### Colunas

- **`form_id`** `text` — nullable. Índice btree para queries futuras tipo "leads do form X".
- **`qualificador_tier1`** `text` — nullable, texto livre.

### SQL

```sql
ALTER TABLE public.leads
  ADD COLUMN form_id text,
  ADD COLUMN qualificador_tier1 text;

CREATE INDEX IF NOT EXISTS idx_leads_form_id
  ON public.leads (form_id);
```

### Não muda

- RLS, triggers, defaults, demais colunas — tudo intacto.
- Nenhum código de aplicação alterado nesta migração. Os tipos do Supabase regeneram automaticamente; quando você for usar `form_id` no app (ex.: filtros, painel), aí ajustamos o frontend numa próxima rodada.

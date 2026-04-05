

## Exportação Propostas + Leads: CSV + VIEW SQL

### O que será feito

1. **VIEW SQL permanente** (`vw_proposals_leads`) — JOIN de `proposals` com `leads`, expondo todos os campos relevantes em uma única consulta. Acessível via `SELECT * FROM vw_proposals_leads` em qualquer script externo.

2. **CSV imediato** — Exportação para `/mnt/documents/propostas_leads.csv` com todos os dados combinados.

### Campos incluídos na VIEW

**Da proposta**: id, slug, status, company_name, contact_name, contact_role, title, scope, investment, considerations, event_date, valid_until, author_name, author_email, author_phone, created_at

**Do lead**: email, telefone, cargo, company, kanban_stage, lost_at_stage, lost_reason, lost_notes, origem, colaboradores, briefing_notes, work_email, company_website, company_description, assigned_to, call_date, created_at (como lead_created_at)

### Detalhes técnicos

- Migração SQL: `CREATE VIEW public.vw_proposals_leads AS SELECT ...` com LEFT JOIN
- RLS não se aplica a views — o acesso segue as permissões da tabela base (já protegida)
- O CSV será gerado via `psql COPY` direto do JOIN
- Exclui leads de teste (`@atinaedu.com.br`, `@movimentocircular.io`)

### Arquivos afetados

| Ação | Detalhe |
|------|---------|
| Migração SQL | CREATE VIEW `vw_proposals_leads` |
| Script export | CSV em `/mnt/documents/propostas_leads.csv` |


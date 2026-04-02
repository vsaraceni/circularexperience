

## Exibir Cargo e Porte no Drawer — Diagnóstico e Correção

### Diagnóstico

O código do Drawer **já exibe** Cargo e Porte (linhas 280-281 de `LeadDrawer.tsx`), e a query em `Proposals.tsx` usa `select("*")` — portanto os dados chegam ao componente. 

Porém há dois problemas reais:

1. **Mapa de `COLABORADORES_LABELS` incompleto** — O banco contém valores `até_100` e `acima_de_2000` que não estão no mapa. Caem no fallback `replace(/_/g, " ")`, que produz texto aceitável mas inconsistente com o padrão formatado.

2. **Cargo exibido sem formatação** — Valores como `sustentabilidade_/_esg` aparecem crus. O PRD pede `replace(/_/g, " ")` + capitalizar primeira letra.

3. **Dashboard usa select parcial** — A query em `Dashboard.tsx` (linha 87) seleciona apenas campos específicos, **sem** `cargo`, `colaboradores`, `email`, `telefone`, etc. Se o Kanban for algum dia renderizado a partir desses dados, os campos ficarão nulos.

### Mudanças

**1. `LeadDrawer.tsx`** — Atualizar `COLABORADORES_LABELS`:
```
"até_100": "Até 100",
"acima_de_2000": "Acima de 2.000",
```
Adicionar esses dois ao mapa existente (linhas 48-55).

**2. `LeadDrawer.tsx`** — Formatar `cargo`:
- Linha 280: trocar `lead.cargo || "—"` por formatação:
  ```ts
  lead.cargo ? lead.cargo.replace(/_/g, " ").replace(/^./, c => c.toUpperCase()) : "—"
  ```

**3. `Dashboard.tsx`** — Expandir select (linha 87):
- Adicionar `email, telefone, cargo, colaboradores, welcome_sent, welcome_sent_at, mensagem, stage_updated_at, last_activity_at, linkedin_added, whatsapp_sent, lost_notes, company_website, company_description, call_date, briefing_notes` ao select — ou simplificar para `select("*")`.

| Arquivo | Mudança |
|---------|---------|
| `LeadDrawer.tsx` | Completar mapa colaboradores + formatar cargo |
| `Dashboard.tsx` | Expandir select para incluir todos os campos |


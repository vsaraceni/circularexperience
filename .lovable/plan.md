

## Coluna "Próx. Ação" — Mostrar Follow-up Agendado + Alerta

### Problema atual

A coluna "Próx. Ação" (linha 547-551) exibe o campo de texto `proxima_acao` do lead, que está vazio para todos os leads. O dado relevante são os **follow-ups agendados** (`lead_follow_ups`), que já são carregados pelo hook `useAllPendingFollowUps`.

### Solução

**1. Substituir o conteúdo da célula** para exibir o próximo follow-up pendente (nota + data), usando o `followUpsByLead` e o array `allPendingFollowUps` que já existem no componente.

- Criar um `nextFollowUpMap` (useMemo) que mapeia `lead_id → { note, due_date }` do follow-up mais próximo ainda não concluído
- Na célula, exibir: data formatada + nota truncada (ex: "14/04 — Ligar para confirmar")
- Se vencido: texto em vermelho
- Se hoje: texto em laranja
- Se futuro: texto em cinza normal

**2. Leads sem follow-up agendado** — ícone de alerta discreto

- Exibir um `⚠` amarelo pequeno com tooltip "Sem próxima ação definida" quando o lead não tem nenhum follow-up pendente
- Usar `AlertTriangle` do Lucide (12px, cor `#F4A736`)

**3. Filtro na coluna** — "Com próxima ação" / "Sem próxima ação"

- Adicionar `filterProxAcao` state com opções: `["✅ Com próxima ação", "⚠️ Sem próxima ação"]`
- Adicionar `ColumnFilter` no header da coluna "Próx. Ação"
- Filtrar no `filteredRows`: checar se o lead tem follow-up pendente no map

**4. Tornar a coluna ordenável**

- Adicionar `"prox_acao"` ao tipo `SortCol`
- Ordenar por `due_date` do próximo follow-up (leads sem follow-up vão ao final)

---

### Arquivos impactados

| Arquivo | Mudança |
|---|---|
| `src/components/admin/PriorityListView.tsx` | Substituir conteúdo da célula "Próx. Ação" por follow-up; adicionar filtro e sort; adicionar ícone de alerta |

Nenhuma migração necessária — os dados já existem na tabela `lead_follow_ups`.


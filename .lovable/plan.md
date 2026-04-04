

## Dashboard de Performance do Funil — Fase 1

### Contexto

O PRD define 10 métricas em 4 seções + briefing diário + filtros globais. Já existe um `/painel` (estratégico com KPIs de campanha) e um `/admin/dashboard` (analítico com gráficos recharts). A proposta é implementar a **Fase 1** (operacional) como uma nova rota `/admin/performance`, adicionando as métricas mais acionáveis no dia a dia da SDR.

Os dados existem: 796 atividades, 113 `stage_mudou` (com content parseável tipo `"Movido de X para Y"`), 85 follow-ups agendados, 34 concluídos. Metadata está vazia nos `stage_mudou`, então os cálculos de tempo usarão o campo `content` para extrair estágios e `created_at` para diffs temporais.

### O que será construído (Fase 1)

1. **Briefing diário** — modal no Pipeline (kanban)
2. **Métrica 9** — Leads envelhecendo (tabela acionável)
3. **Métrica 6** — Disciplina de follow-up (card + lista de atrasados)
4. **Métrica 4** — Ações diárias (barras empilhadas)
5. **Filtros globais** — Período + Responsável

### Detalhes técnicos

#### 1. Migração SQL

Adicionar coluna `last_briefing_seen` na tabela `profiles` para controlar a exibição do modal de briefing:

```sql
ALTER TABLE profiles ADD COLUMN last_briefing_seen date;
```

Adicionar `metadata` estruturado nos `stage_mudou` futuros (alterar KanbanBoard para salvar `{ from: "em_contato", to: "call_agendada" }` no metadata ao registrar atividade de mudança de estágio).

#### 2. Nova rota `/admin/performance`

Adicionar ao `App.tsx` e ao `CrmNavbar.tsx` (novo módulo "Performance" com ícone `Activity` ou `BarChart2`).

#### 3. Hook `usePerformanceDashboard.ts`

Fetch completo de `lead_activities` (sem limite de 7 dias), `leads`, `profiles`, `lead_follow_ups`. Aplica filtros de período e responsável. Calcula:

- **Tempo de aging por lead**: `now() - stage_updated_at` para cada lead ativo, com thresholds por estágio
- **Follow-up discipline**: contagem de agendados vs concluídos no período, lista de atrasados
- **Ações diárias**: agrupar atividades por dia e categoria (Comunicação, Progresso, Follow-up, Propostas, Outros)

Exclui leads de teste (`isTestEmail`).

#### 4. Página `PerformanceDashboard.tsx`

Layout com 4 seções:

```text
┌─────────────────────────────────────────────────────┐
│ [Filtros: Período | Responsável]                    │
├───────────────┬───────────────┬──────────────────────┤
│ Follow-up     │ Ações/dia     │                      │
│ Card          │ Card          │                      │
├───────────────┴───────────────┴──────────────────────┤
│ Ações Diárias — Barras empilhadas (recharts)         │
├──────────────────────────────────────────────────────┤
│ Leads Envelhecendo — Tabela com badge de urgência    │
│ (clique abre Lead Drawer)                            │
└──────────────────────────────────────────────────────┘
```

- **Follow-up card**: Agendados X / Concluídos Y, barra de progresso colorida
- **Ações/dia card**: média de ações/dia no período, % vs período anterior
- **Barras empilhadas**: recharts BarChart com categorias por cor
- **Leads envelhecendo**: tabela com Nome, Empresa, Estágio, Dias no estágio, Última atividade, Responsável. Badge vermelho/amarelo conforme threshold. Clique abre LeadDrawer.

#### 5. Briefing diário (modal no Pipeline)

No `Pipeline.tsx`, ao montar:
- Verificar `profiles.last_briefing_seen` vs hoje
- Se diferente, exibir Dialog com:
  - Leads por estágio (contagem)
  - Leads com SLA estourado
  - Follow-ups pendentes hoje
  - Total de ações ontem
- Botões: "Ver Performance" → navega `/admin/performance` | "Fechar" → dismiss
- Ao exibir, update `last_briefing_seen = today`

#### 6. Estilo visual

Seguir as cores do PRD: roxo `#5F2558`, turquesa `#2FB2C0`, laranja `#F4A736`, coral `#EB626D`. Background cinza `#F0ECEA`. Cards com `border-radius: 12px`. Fonte Raleway (já usada no projeto).

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| Migração SQL | `last_briefing_seen` em profiles, metadata em stage_mudou futuro |
| `src/hooks/usePerformanceDashboard.ts` | Criar — fetch + cálculos das 3 métricas + filtros |
| `src/pages/admin/PerformanceDashboard.tsx` | Criar — layout com filtros, cards, gráfico, tabela |
| `src/components/admin/CrmNavbar.tsx` | Adicionar módulo "Performance" |
| `src/App.tsx` | Nova rota `/admin/performance` |
| `src/pages/admin/Pipeline.tsx` | Adicionar modal de briefing diário |
| `src/components/admin/KanbanBoard.tsx` | Salvar metadata `{ from, to }` no `stage_mudou` |


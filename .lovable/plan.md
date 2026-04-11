

## Avaliação do PRD — Gráficos de Evolução Temporal + Snapshot Diário

### Estado Atual do Sistema

- O painel `/painel` (StrategicDashboard) mostra: banner de campanha, 5 KPIs, cards SDR/Closer, funil de conversão e bloco "Ações do Dia"
- Recharts já está instalado e em uso (Dashboard e PerformanceDashboard)
- A tabela `daily_snapshots` **não existe** ainda
- O CRM tem dados desde **18/03/2026** (~24 dias de histórico)
- SDR identificada via `profiles.role_label = 'sdr'` (Lívia Lins, id `6660c904...`)
- Campo `valor_proposta` (numeric) existe na tabela `leads`; `proposals.investment` é texto parseado

---

### Avaliação do PRD

**O PRD é sólido e bem estruturado.** Algumas observações:

**Pontos fortes:**
- A separação em snapshot (dados) + gráficos (visualização) é a arquitetura correta — evita queries pesadas em tempo real
- A idempotência via upsert por `snapshot_date` é essencial
- O backfill retroativo via `stage_mudou` é viável — esses registros existem no `lead_activities` com metadata `{from, to}`
- As taxas de conversão rolantes de 14 dias são uma métrica genuinamente útil

**Pontos de atenção / ajustes sugeridos:**

1. **Pipeline value**: O PRD diz "soma dos valores de proposta dos leads ativos". O sistema atual usa `proposals.investment` (texto) com parsing customizado (`parseInvestment`). Sugiro usar `leads.valor_proposta` (numeric, já existe) para simplificar e manter consistência com o que a equipe edita no drawer.

2. **Ações SDR**: O PRD diz "usar o mesmo mecanismo do card SDR". Atualmente filtra por `profiles.role_label = 'sdr'` e depois por `assigned_to`. Para o snapshot, faz mais sentido contar atividades em `lead_activities` cujo `user_id` pertence a um perfil SDR — e é isso que implementarei.

3. **Backfill**: Com ~24 dias de dados, o backfill é rápido. A reconstrução do estado diário via atividades `stage_mudou` é factível — cada registro tem `metadata.from` e `metadata.to`.

4. **Cron às 23:55 BRT**: Edge Functions não suportam cron nativo. Duas opções: (a) pg_cron via SQL function, ou (b) usar o `check-notifications` cron existente como trigger. Recomendo **pg_cron** com uma função SQL `generate_daily_snapshot()` — mais robusto e não depende de edge function.

5. **Remoção do "Ações do Dia"**: Confirmo que essa funcionalidade já existe no Pipeline (Briefing Diário) e no PerformanceDashboard. Pode ser removida sem perda.

---

### Plano de Implementação (4 etapas)

**Etapa 1 — Tabela + Função SQL + Backfill**
- Migração SQL: criar tabela `daily_snapshots` conforme PRD
- Criar função SQL `generate_daily_snapshot()` que faz o cálculo completo
- Configurar pg_cron para rodar às 23:55 BRT (02:55 UTC)
- Rodar backfill via SQL para os ~24 dias de histórico
- RLS: leitura para authenticated

**Etapa 2 — Hook de dados**
- Criar `src/hooks/useDailySnapshots.ts` que busca dados de `daily_snapshots` com filtro de período
- Retorna dados formatados para cada gráfico

**Etapa 3 — 6 Gráficos no StrategicDashboard**
- Componente `EvolutionCharts` com grid 2x3
- Barra de filtro de período (7d / 14d / 30d / Tudo)
- Gráficos usando Recharts (já instalado): BarChart, AreaChart, LineChart
- Skeleton loaders durante carregamento
- Cores e estilos conforme PRD

**Etapa 4 — Remoção do bloco "Ações do Dia"**
- Remover o card e ajustar layout do grid

| Arquivo | Mudança |
|---------|---------|
| Migração SQL | Criar `daily_snapshots`, função `generate_daily_snapshot()`, pg_cron, backfill |
| `src/hooks/useDailySnapshots.ts` | Novo hook para buscar snapshots |
| `src/components/admin/EvolutionCharts.tsx` | Novo componente com 6 gráficos |
| `src/pages/admin/StrategicDashboard.tsx` | Adicionar gráficos, remover "Ações do Dia" |
| `src/hooks/useStrategicDashboard.ts` | Remover `dailyActions` (não mais necessário) |

---

### Risco principal

O pg_cron pode não estar habilitado no projeto. Se não estiver, a alternativa é uma Edge Function `generate-daily-snapshot` invocada por cron externo ou pelo frontend no primeiro acesso do dia.

Deseja aprovar para iniciar a implementação?


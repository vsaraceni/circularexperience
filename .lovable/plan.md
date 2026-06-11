
## Objetivo

Inserir uma nova etapa **Tratativas** no pipeline, posicionada **entre Nutrição e Fechado**. É uma etapa "quente" tipo: proposta já apresentada/discutida, lead em negociação final (revisão de contrato, alinhamento de escopo, ajuste de valor, aguardando aprovação interna do cliente).

Slug técnico: `tratativas`. Label: `Tratativas`. Cor sugerida: vermelho-âmbar `hsl(14, 88%, 45%)` (entre laranja de Nutrição e verde de Fechado — sinaliza urgência de conversão).

## Ordem nova do pipeline

```
novo → boas_vindas → em_contato → call_agendada → proposta → nutricao → tratativas → fechado
                                                                                    ↘ perdido
```

## Avaliação de impacto (auditoria já feita no código)

### 1. Frontend — listas de stages, labels, cores

Arquivos que enumeram stages e precisam incluir `tratativas`:

- `src/components/admin/KanbanBoard.tsx` — coluna nova entre nutrição e fechado; `STAGE_LABELS`.
- `src/components/admin/LeadDrawer.tsx` — `STAGE_ORDER` (botão "Avançar"), `STAGE_LABELS`, condicionais de exibição (`nutricao` em linhas 877/883).
- `src/components/admin/LeadCard.tsx` — `LOST_STAGES` (permitir perder em tratativas), switches de cor/ícone (87/104).
- `src/components/admin/PriorityListView.tsx` — `STAGE_LABELS`, `STAGE_COLORS`, `STAGE_ICONS`.
- `src/components/admin/PriorityCard.tsx` — `STAGE_LABELS`, `STAGE_COLORS`.
- `src/components/admin/DailyBriefing.tsx`, `DigestReportDialog.tsx` — labels e categorização.
- `src/components/admin/EvolutionCharts.tsx` — adicionar linhas de conversão `Nutrição→Tratativas` e `Tratativas→Fechado` (substitui `Nutrição→Fechado`).
- `src/components/admin/integrations/IntegrationFormDialog.tsx` — array `STAGES` para `default_stage` (incluir).
- `src/components/admin/messageTemplates.ts` — adicionar `tratativas` em `STAGE_KEYS` e label.
- `src/pages/admin/Pipeline.tsx`, `src/pages/admin/Dashboard.tsx` — listas/labels.
- `src/hooks/useStrategicDashboard.ts` — `ACTIVE_STAGES`, `STAGE_ORDER`, mapa `maxReachedStage`, lógica de stale leads (incluir `tratativas` junto com `proposta`/`nutricao`).
- `src/hooks/usePerformanceDashboard.ts` — `STAGE_THRESHOLDS`, `STAGE_LABELS`.

### 2. SLAs e notificações

- `src/components/admin/UrgencyBadge.tsx`: adicionar `tratativas: { warningD: 3, criticalD: 7 }` (negociação ativa, ciclo curto).
- `supabase/functions/check-notifications/index.ts`: adicionar `tratativas: { criticalD: 7 }`.
- `src/hooks/usePerformanceDashboard.ts`: `tratativas: { warning: 3, critical: 7 }`.
- `src/components/admin/DigestReportDialog.tsx`: idem.

### 3. KPIs / Snapshot diário (banco)

A função `public.generate_daily_snapshot` e a tabela `daily_snapshots` referenciam `leads_nutricao` e `conv_nutricao_fechado`. Mudanças:

**Tabela `daily_snapshots`** — adicionar:
- `leads_tratativas integer NOT NULL DEFAULT 0`
- `conv_nutricao_tratativas numeric(5,2)`
- `conv_tratativas_fechado numeric(5,2)`

**Manter** `conv_nutricao_fechado` por compatibilidade histórica (passa a refletir `nutricao → fechado` direto, que vai cair a ~0 com o tempo).

**Função `generate_daily_snapshot`** — recriar com:
- Contagem `kanban_stage = 'tratativas'`.
- Funil "reached proposta/nutrição/fechado" incluir `tratativas` como estágio superior.
- Cálculo novo de `conv_nutricao_tratativas` e `conv_tratativas_fechado`.
- `pipeline_value` continua excluindo só `perdido` e `fechado` (tratativas conta no pipeline ✔).

### 4. Lead lifecycle e regras

- `kanban_stage` é `text` livre (não enum) — não precisa de migração de enum.
- Trigger `notify_stage_change` hoje só notifica em `proposta`. Sugestão: adicionar bloco análogo para `tratativas` (notificar admin: "Lead em Tratativas: …"). Opcional.
- Trigger `trigger_welcome_email` e `trigger_whatsapp_gptmaker` só agem em `novo` — não afetadas.
- Lógica de "lost_at_stage" já é livre, vai funcionar com tratativas automaticamente.
- `closed_at` continua sendo setado só ao entrar em `fechado` — botão "Avançar" do LeadDrawer respeita `STAGE_ORDER`, então tratativas vira o passo obrigatório antes de fechar.

### 5. Dados existentes

Leads atualmente em `nutricao` **permanecem em nutrição** — não migra automaticamente. SDR decide caso a caso quando movê-los para tratativas. (Confirmar com você antes de aplicar; alternativa é migrar leads `nutricao` com `valor_proposta IS NOT NULL` há mais de N dias para tratativas — sugiro **não** fazer.)

### 6. Snapshots históricos

Os snapshots passados continuam consistentes (todos `leads_tratativas = 0`). O backfill de `generate_daily_snapshot` para datas passadas pode ser re-executado se desejar reconstituir tratativas a partir do histórico de `lead_activities` — não obrigatório.

## Plano de implementação

### Etapa 1 — Migração SQL
1. `ALTER TABLE daily_snapshots ADD COLUMN leads_tratativas integer NOT NULL DEFAULT 0, ADD COLUMN conv_nutricao_tratativas numeric(5,2), ADD COLUMN conv_tratativas_fechado numeric(5,2);`
2. `CREATE OR REPLACE FUNCTION public.generate_daily_snapshot` — versão atualizada cobrindo tratativas.
3. (Opcional) Estender `notify_stage_change` para também notificar em `tratativas`.

### Etapa 2 — Frontend
- Inserir `tratativas` em todas as listas/maps/colors/labels/SLAs listadas acima.
- `KanbanBoard`: coluna nova com cor `hsl(14, 88%, 45%)` entre nutrição e fechado.
- `EvolutionCharts`: trocar linha única `Nutrição→Fechado` por duas linhas (`Nutrição→Tratativas`, `Tratativas→Fechado`); manter série legacy opcional.

### Etapa 3 — Edge function
- `check-notifications/index.ts`: incluir SLA de tratativas.

### Etapa 4 — Verificação
- Build limpo, tipos regenerados, abrir `/admin/pipeline` e ver a coluna nova, mover um lead nutrição→tratativas→fechado, conferir Dashboard Estratégico.

## Decisões que assumi (corrija se necessário)

1. **SLA tratativas**: warning 3 dias / crítico 7 dias.
2. **Não migrar** leads atuais de nutrição para tratativas (SDR move manualmente).
3. **Não regenerar** snapshots históricos.
4. **Notificar admin** quando lead entra em tratativas (igual ao gatilho de proposta).
5. Cor: vermelho-âmbar `hsl(14, 88%, 45%)`.

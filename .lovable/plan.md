

## Correção: Relatório de Avanços com dados inconsistentes

### Diagnóstico

O componente `DigestReportDialog.tsx` tem dois problemas que fazem os dados parecerem fixos/hardcoded:

1. **Follow-ups sem filtro de período** (linha 113): A query busca TODOS os follow-ups do banco, sem `.gte()/.lte()` pelo período selecionado. Resultado: os números de follow-ups são sempre os mesmos independente do período escolhido.

2. **Missões mostram estado atual do pipeline** (linhas 122-137): As missões (Novos, Follow-up, Agendamento, Calls, Briefing) calculam o estado atual dos leads, não filtram por período. Quando o gestor escolhe "Semana passada", os dados de missões são idênticos a "Hoje". Isso faz parecer hardcoded.

### Solução

| Problema | Correção |
|----------|---------|
| Follow-ups sem filtro | Adicionar `.gte("due_date", fromDate).lte("due_date", toDate)` na query |
| Missões fixas | Manter missões como "estado atual" (são um snapshot do pipeline agora), mas separar visualmente com label "Estado atual do pipeline" para não confundir com dados do período. Alternativamente, para períodos passados, contar atividades de stage_mudou no período como proxy de progresso |
| Ações fixas para "Hoje" com 0 | Nenhum bug — se não houve ações hoje, mostra 0 corretamente |

**Abordagem escolhida para Missões**: Para períodos passados, as missões não fazem sentido (são tarefas de hoje). A seção de Missões só aparece quando o período é "Hoje". Para outros períodos, mostrar um resumo de movimentação: quantos leads entraram, quantos avançaram de etapa, quantos foram fechados/perdidos — tudo filtrado pelo período.

### Mudanças no arquivo `DigestReportDialog.tsx`

1. **Follow-ups**: filtrar por `due_date` dentro do período
2. **Missões**: exibir apenas para período "Hoje"
3. **Novo bloco "Movimentação"** (para todos os períodos): contar atividades `lead_recebido`, `stage_mudou`, `fechado`, `perdido` no período — dados que realmente mudam conforme o período
4. **SLA críticos**: manter como estado atual (sempre relevante), mas com label claro

### Sem migração SQL

Todas as queries já funcionam com as tabelas existentes — o problema é apenas lógica de filtro no frontend.


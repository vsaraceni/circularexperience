

## Avaliação Estratégica — Dashboard Estratégico Comercial

### Estado atual vs PRD

O Dashboard atual (`Dashboard.tsx`, 358 linhas) é um painel de relatórios simples com gráficos de barras/pizza estáticos. O PRD pede um **cockpit operacional em tempo real** — são sistemas fundamentalmente diferentes. Recomendo criar uma **nova página** (`/painel`) em vez de reescrever o Dashboard existente.

### Gaps de infraestrutura identificados

Antes de construir o dashboard, há lacunas que precisam ser resolvidas:

| Gap | Situação atual | Necessário |
|-----|---------------|------------|
| SLAs | Hardcoded em `UrgencyBadge.tsx` | PRD diz "ler do Supabase". Opção: manter hardcoded (já funciona) ou migrar para tabela `sla_config` |
| Papel SDR/Closer | Não existe no DB | Precisa de campo `role_label` e `badge` em `profiles` para identificar quem é SDR vs Closer |
| Valor de proposta | Campo `investment` em `proposals` (texto livre, ex: "R$ 15.000") | Funciona, mas parsing é frágil — já existe lógica no Dashboard atual |
| Realtime | Não usado no Dashboard atual | Precisa de subscription em `leads` e `lead_activities` |
| Protocolo BV completo | Eventos já rastreados: `welcome_enviado`, `linkedin_adicionado`, `whatsapp_enviado` | Basta consultar `lead_activities` por lead |

### Recomendação: SLAs hardcoded vs tabela

O PRD insiste em "ler do Supabase", mas os SLAs já estão hardcoded e funcionam bem no Kanban. Criar uma tabela `sla_config` adicionaria complexidade sem ganho real (vocês são 3 pessoas, não vão mudar SLAs com frequência). **Recomendo manter hardcoded** e importar `SLA_CONFIG` de `UrgencyBadge.tsx` no dashboard — uma única fonte de verdade no código.

### Estratégia de implementação em 3 fases

**Fase 1 — Estrutura + Pipeline + Health Score** (maior valor, entregável independente)
- Nova rota `/painel` com página `StrategicDashboard.tsx`
- Header roxo com Health Score (anel circular), velocity do dia, badge de alertas
- Faixa de 7 cartões de pipeline com contagem + barra de saúde
- Realtime subscription em `leads` e `lead_activities`
- Migration: adicionar `role_label` e `badge_initials` em `profiles`

**Fase 2 — Painéis SDR/Closer + Alertas**
- Coluna de alertas automáticos (6 regras do PRD)
- Painel SDR com SLA Compliance, Taxa de Ativação, Protocolo Completo
- Painel Closer com conversões, valor em Nutrição, aging
- Ações prioritárias prescritivas no rodapé de cada painel

**Fase 3 — Funil de conversão + Ações do dia**
- Gráfico de barras horizontal com taxas de conversão entre etapas
- Seletor de período (Hoje / 7d / 30d)
- Lista de ações do dia geradas automaticamente
- Navegação: clicar em alerta/ação → CRM filtrado

### Complexidade estimada

| Componente | Linhas aprox. | Queries Supabase |
|------------|--------------|-----------------|
| Header + Health Score | ~200 | leads + activities (7d) |
| Pipeline cards | ~150 | leads (já carregado) |
| Alertas | ~200 | activities + leads |
| Painel SDR | ~200 | activities filtradas |
| Painel Closer | ~200 | activities + proposals |
| Funil + Ações | ~250 | activities por período |
| Hooks/utils | ~150 | — |
| **Total** | **~1350** | 3-4 queries + Realtime |

### Pergunta crítica antes de começar

O PRD referencia nomes de pessoas (Lívia = SDR, Alinye = Closer) e badges (LL, AL, VS). Hoje o `profiles` não tem essa informação. Duas opções:

1. **Hardcodar** os nomes/badges no código (rápido, frágil)
2. **Adicionar campos** `role_label` e `badge_initials` na tabela `profiles` (correto, requer migration + preenchimento manual)

Recomendo opção 2 — é uma migration simples e torna o dashboard dinâmico.

### Próximo passo sugerido

Aprovar a estratégia geral e começar pela **Fase 1** — que já entrega valor visual e operacional significativo, e serve como fundação para as fases seguintes.




## SLAs Visuais e Urgency por Estágio

### O que muda

Substituir o sistema atual de urgência (baseado em `last_activity_at` com thresholds fixos de 2/5 dias) por um sistema de SLA por estágio, com tempo decorrido visível, background colorido, badge de próxima ação, contadores de atrasados nas colunas e ordenação por urgência.

### Mudanças

#### 1. `UrgencyBadge.tsx` — Reescrever completamente

Recebe `stage` e `stageUpdatedAt` (em vez de apenas `lastActivityAt`). Para Nutrição, recebe também `lastActivityAt`.

Lógica de SLA por estágio:
- **Novo**: horas. Normal ≤2h, atenção 2–4h, crítico >4h
- **Boas-Vindas**: horas/minutos. Normal ≤2h, atenção 2–6h, crítico >6h
- **Em Contato**: dias. Normal ≤2d, atenção 2–4d, crítico >4d
- **Call Agendada**: dias. Normal ≤5d, atenção 5–10d, crítico >10d
- **Proposta**: dias. Normal ≤2d, atenção 2–4d, crítico >4d
- **Nutrição**: dias desde `last_activity_at`. Normal ≤5d, atenção 5–10d, crítico >10d
- **Fechado**: sem badge

Formato de exibição:
- Novo e Boas-Vindas: horas/minutos ("1h32m", "4h15m"). Acima de 24h: "2d"
- Demais: dias ("1d", "3d"). Abaixo de 24h: "hoje"

Exportar função `getUrgencyLevel(stage, stageUpdatedAt, lastActivityAt)` que retorna `"normal" | "warning" | "critical"` — será usada pelo card e pela coluna.

#### 2. `LeadCard.tsx` — Background por urgência + badge de ação

Substituir `getUrgencyClasses` por chamada a `getUrgencyLevel`. Cores de fundo:
- Normal: bg padrão (`bg-card`)
- Atenção: `bg-[#FFF8E1]` (dark mode: `dark:bg-amber-900/20`)
- Crítico: `bg-[#FFEBEE]` (dark mode: `dark:bg-red-900/20`)

Mover o tempo decorrido para o canto superior direito (onde hoje fica o UrgencyBadge).

Adicionar badge de próxima ação na parte inferior do card (pill cinza claro):
| Estágio | Badge |
|---|---|
| Novo | "Enviar boas-vindas" |
| Boas-Vindas | "LinkedIn + WhatsApp" |
| Em Contato | "Qualificar e agendar call" |
| Call Agendada | "Aguardando call" |
| Proposta | "Elaborar proposta" ou "Registrar envio" (condicional) |
| Nutrição | "Follow-up" se >5d, senão "Aguardando retorno" |
| Fechado | sem badge |

#### 3. `KanbanColumn.tsx` — Contador de atrasados + ordenação

No header, ao lado do count existente, mostrar "· N atrasados" em vermelho se houver cards críticos.

Ordenar leads: críticos primeiro, depois atenção, depois normal. Dentro de cada grupo, mais antigo primeiro.

#### 4. Ajustes de props

Passar `stage` ao `UrgencyBadge` e ao cálculo de urgência. Todos os dados necessários (`kanban_stage`, `stage_updated_at`, `last_activity_at`) já existem no type `Lead`.

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `UrgencyBadge.tsx` | Reescrever: SLA por estágio, formato horas/dias, exportar `getUrgencyLevel` |
| `LeadCard.tsx` | Background por nível, tempo no canto sup. direito, pill de próxima ação |
| `KanbanColumn.tsx` | Contador de atrasados no header, ordenação por urgência |




## Diagnóstico confirmado — SLA inconsistente em "Call Agendada"

Todos os leads da imagem estão em **Call Agendada**, cuja config atual é:

| Etapa | Verde (normal) | Amarelo (atenção) | Vermelho (vencido) |
|---|---|---|---|
| call_agendada | 0–4d | **5–9d** | ≥ 10d |

O que se vê na tela (ordenado desc por SLA):

```text
🔴 14d   ← correto (≥10d)
🔴 14d   ← correto
🟢 7d    ← ERRADO: deveria ser 🟡 (5–9d)
🟢 6d    ← ERRADO: deveria ser 🟡
🟡 5d    ← correto
🟢 5d    ← ERRADO: mesmo dia, cor diferente
🟢 5d    ← ERRADO
🟢 5d    ← ERRADO
🟢 5d    ← ERRADO
🟢 1d    ← correto
🟢 23h   ← correto
🟢 22h   ← correto
```

**Causa raiz:** quando o lead tem **follow-up agendado pendente**, `getUrgencyLevel` em `UrgencyBadge.tsx` (linha 21) força o nível para `"normal"` independente dos dias — e a UI pinta de **verde** com o ícone ✅. Resultado: 7d com FU agendado vira 🟢, ao lado de 5d sem FU que vira 🟡. Confunde porque mistura dois conceitos diferentes ("dentro do prazo" vs. "tem ação futura agendada") na **mesma cor**.

A regra "verde → amarelo → vermelho" só vale se compararmos coisas comparáveis: tempo decorrido. Hoje a coluna mistura tempo + estado de follow-up.

---

## Solução — separar visualmente "tem FU" de "no prazo"

### 1. Nova cor neutra para "tem follow-up agendado"

Em `UrgencyBadge.tsx`, introduzir um quarto estado visual `scheduled` (azul/cinza, ícone 📅) usado **apenas** quando `hasPendingFollowUp = true`. O verde (`normal`) passa a significar exclusivamente "dentro do SLA por tempo, sem FU agendado".

```text
Estados visuais finais (nesta ordem de severidade):
🔴 Vermelho  — Vencido (acima do limite crítico)
🟡 Amarelo   — Atenção (entre warning e critical)
🟢 Verde     — No prazo (abaixo do warning, sem FU)
🔵 Azul/📅   — Tem follow-up agendado (qualquer tempo)
```

### 2. Ordenação coerente na coluna SLA

No `PriorityListView.tsx`, o sort por SLA passa a ordenar **primeiro pelo nível de severidade**, depois por dias decorridos dentro do mesmo nível. Assim, descendo a coluna ordenada desc, a sequência sempre será: 🔴 → 🟡 → 🟢 → 🔵, sem saltos de cor.

### 3. Tooltip "ⓘ" no header da coluna SLA

Pequeno ícone de info no cabeçalho explicando os limites por etapa, para o usuário entender por que `5d` em "Em Contato" é vermelho mas `5d` em "Call Agendada" é amarelo:

| Faixa | Etapas | 🟢 | 🟡 | 🔴 |
|---|---|---|---|---|
| Resposta rápida | Novo, Boas-Vindas | <2h | 2–4h | ≥4h |
| Curta | Em Contato, Proposta | 0–1d | 2–3d | ≥4d |
| Longa | Call Agendada, Nutrição | 0–4d | 5–9d | ≥10d |

---

## Arquivos impactados

- `src/components/admin/UrgencyBadge.tsx` — adicionar estado `scheduled` (azul + 📅), usado quando `hasPendingFollowUp`. Verde fica reservado para "no prazo por tempo".
- `src/components/admin/PriorityListView.tsx` — comparator do sort por SLA usa nível primeiro; tooltip ⓘ no header da coluna SLA com a tabela de limites; novo filtro "📅 Com FU agendado" no popover de SLA.

Sem mudanças em: Kanban, banco, RLS, edge functions, notificações.

## Critérios de aceite

- Na imagem do exemplo, os 7d/6d/5d que hoje aparecem 🟢 passam a aparecer 🔵 📅 (ou 🟡 se não tiverem FU pendente).
- Descendo a coluna SLA ordenada desc, cores nunca regridem em severidade.
- Verde nunca mais aparece misturado entre amarelos com mesmo número de dias.
- Tooltip ⓘ no header explica os limites por etapa.


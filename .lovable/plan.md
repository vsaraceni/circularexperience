

## Revisão completa do SLA — eliminar a confusão

### O que está quebrado hoje

1. **Mesmo lead, cores diferentes em telas diferentes**
   - `LeadDrawer.tsx` linha 244 chama `<UrgencyBadge>` **sem** passar `hasPendingFollowUp` → drawer ignora follow-ups e mostra 🔴 9d.
   - `LeadCard.tsx` linha 194: idem, sem `hasPendingFollowUp`.
   - `PriorityListView.tsx` calcula `hasPending` e passa → lista mostra ✅/📅.
   - Resultado: o **mesmo lead** "Greco e Guerreiro" aparece como ✅ 9d na lista grande e 🔴 9d no drawer. Inaceitável.

2. **Conceito confuso: "SLA" mistura dois sinais**
   - Hoje SLA mede **"dias desde a última atividade"**, comparado a um limite por etapa.
   - Mas se o usuário **agendou explicitamente** um próximo passo para daqui a 4 dias, o lead **não está negligenciado** — está sob controle. Marcá-lo como 🔴 vencido pune o usuário por ter sido organizado.
   - O usuário (corretamente) lê SLA como **"este lead precisa da minha atenção?"**, não como "quantos dias passaram".

3. **`scheduled` (azul-bebê) e `normal` (verde-bebê) são visualmente idênticos** em badges de 18px, como já confirmado na lista.

4. **Follow-up overdue** hoje **derruba** o estado scheduled e cai no SLA por tempo. Isso é correto, mas invisível: o usuário não entende por que Salt 6d virou 🔴 e Motiva 6d virou ✅.

---

### Modelo novo — SLA = "precisa da minha atenção?"

**Regra única e canônica**, aplicada em **todos** os lugares (drawer, card kanban, lista, missões):

```text
1. Se o lead tem follow-up VENCIDO (overdue):
     → 🔴 critical   "Follow-up vencido há Xd"

2. Se o lead tem follow-up agendado para HOJE:
     → 🟡 today      "Follow-up hoje"

3. Se o lead tem follow-up agendado no FUTURO:
     → 🟣 scheduled  "Próx. ação em DD/MM"   (roxo, não azul)

4. Se NÃO tem follow-up agendado:
     → aplica SLA por tempo na etapa (a tabela atual):
       - dentro do prazo  → 🟢 normal     "Xd"
       - acima do warning → 🟡 warning    "Xd · sem ação agendada"
       - acima do critical→ 🔴 critical   "Xd · sem ação agendada"
```

**Pontos-chave do modelo:**

- A **prioridade é o follow-up**, não o tempo. Lead com plano = sob controle.
- **Verde só quando**: nenhum follow-up E dentro do prazo. Verde vira raro e significativo.
- **Roxo `scheduled`** (`#5E35B1` sobre `#EDE7F6`) é inequivocamente diferente de verde.
- **Vermelho/amarelo "sem ação agendada"** explicitam o motivo no próprio badge.
- **Hierarquia de severidade** (para sort): `critical > today > warning > scheduled > normal`.

---

### Mudanças de código

1. **`UrgencyBadge.tsx`** — refatorar a regra principal:
   - Função `getUrgencyLevel` passa a receber também `nextFollowUp: { due_date: string } | null` (não só boolean).
   - Adicionar nível `today` (amarelo `#F9A825` sobre `#FFFDE7`, ícone ⏰).
   - Trocar paleta `scheduled` para roxo (`bg #EDE7F6`, `fg #5E35B1`).
   - `formatElapsed` quando `urgency === "scheduled"` mostra `"DD/MM"` em vez de `"Xd"`.
   - Quando `urgency === "today"` mostra `"hoje"`.

2. **`LeadDrawer.tsx`** linha 244 — passar `nextFollowUp` (hook `useFollowUps` por lead).

3. **`LeadCard.tsx`** linha 194 — idem, propagar via prop do `KanbanBoard` que já tem `useAllPendingFollowUps`.

4. **`PriorityListView.tsx`** — substituir `hasPendingFollowUp` boolean pelo objeto `nextFollowUp`; atualizar `URGENCY_RANK` (`critical:0, today:1, warning:2, scheduled:3, normal:4`); atualizar legenda do header ⓘ com a nova regra (5 estados, sem mais ambiguidade).

5. **`KanbanBoard.tsx` / `KanbanColumn.tsx` / `MissionsBanner.tsx`** — propagar `nextFollowUp` do lead para `getUrgencyLevel`.

Sem mudanças em: banco, RLS, edge functions, notificações, sort de Kanban (apenas a fonte de severidade muda).

---

### Critérios de aceite

- "Greco e Guerreiro" com follow-up em 27/04 aparece **igual em todo lugar**: drawer, kanban, lista, missões → 🟣 "27/04" (roxo).
- Salt/ECOGEST com follow-up vencido aparecem 🔴 "Follow-up vencido há 1d" em todo lugar.
- Lead com follow-up para hoje aparece 🟡 ⏰ "hoje".
- Lead **sem follow-up** e dentro do prazo da etapa → 🟢 "Xd" (verde raro, indica "ok, mas pense em agendar algo").
- Lead **sem follow-up** e acima do limite → 🟡 ou 🔴 com sufixo "sem ação agendada".
- Tooltip da legenda no header da lista mostra os 5 estados com swatches coloridos e descrição em uma linha cada.
- Sort por SLA na lista descendo: 🔴 → 🟡 hoje → 🟡 sem ação → 🟣 → 🟢, sem regressões.


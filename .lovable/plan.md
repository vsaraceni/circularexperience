

## Missões do Dia — Banner de Checklist Dinâmico no Kanban

### Visão geral

Um banner horizontal fixo acima das colunas do Kanban com 5 "missões" calculadas automaticamente a partir dos dados reais do pipeline. Cada missão é um card compacto clicável com indicador de cor (verde/amarelo/vermelho), contagem e texto. Barra de progresso fina abaixo. Estado "Pipeline em dia" quando tudo resolvido.

### Análise de viabilidade vs PRD

O PRD pede 5 missões. Das 5, **3 funcionam com os dados atuais** e **2 precisam de novos campos no banco**:

| Missão | Dados necessários | Status |
|--------|-------------------|--------|
| 1 — Leads novos sem ação | `kanban_stage = 'novo'` + `assigned_to` | Pronto |
| 2 — Follow-up Boas-Vindas | `kanban_stage = 'boas_vindas'` + SLA existente | Pronto |
| 3 — Aguardando agendamento (Em Contato) | `kanban_stage = 'em_contato'` + `assigned_to` | Pronto |
| 4 — Calls amanhã/hoje | **`call_date` não existe na tabela leads** | Precisa migração |
| 5 — Briefings incompletos | **`briefing` não existe na tabela leads** | Precisa migração |

### Implementação em 2 fases

**Fase 1 (esta entrega)**: Missões 1-3 + estrutura completa do banner + migração para `call_date` e `briefing_notes` + Missões 4-5.

---

### 1. Migração SQL — Novos campos na tabela `leads`

```sql
ALTER TABLE public.leads
  ADD COLUMN call_date timestamptz DEFAULT NULL,
  ADD COLUMN briefing_notes text DEFAULT NULL;
```

- `call_date`: data/hora da call agendada (preenchida quando o usuário agenda via Google Calendar)
- `briefing_notes`: texto livre do briefing (campo no Drawer, aba Resumo)

Atualizar a action `schedule_call` no `KanbanBoard.tsx` para gravar `call_date` junto com a mudança de estágio.

---

### 2. Componente `MissionsBanner.tsx` (novo)

**Arquivo**: `src/components/admin/MissionsBanner.tsx`

Componente puro que recebe os leads filtrados por usuário e calcula as 5 missões:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ [ 3 ] Leads novos    [ 2 ] Boas-Vindas  [ 1 ] Agendamentos  ...   │
│  sem ação (4h)         pendentes          pendentes                 │
│ ████████████░░░░░░░░  2 de 5 resolvidas                            │
└──────────────────────────────────────────────────────────────────────┘
```

**Lógica de cada missão:**

1. **Leads novos sem ação**: `leads.filter(l => l.kanban_stage === 'novo' && (!l.assigned_to || l.assigned_to === userId))`. Mostra tempo do mais antigo via `stage_updated_at`.

2. **Follow-up Boas-Vindas**: Leads em `boas_vindas` com SLA warning ou critical (reusa `getUrgencyLevel` existente).

3. **Agendamentos pendentes**: Leads em `em_contato` atribuídos ao usuário.

4. **Calls próximas**: Leads em `call_agendada` com `call_date` hoje (vermelho) ou amanhã (amarelo). Sem `call_date` = ignorado.

5. **Briefings incompletos**: Leads em `call_agendada` com `briefing_notes` null ou vazio.

**Visual de cada card missão:**
- Borda esquerda colorida (3px): `#2FB2C0` (ok), `#F4A736` (atenção), `#EB626D` (urgente)
- Número grande à esquerda ou checkmark verde quando resolvido
- Texto descritivo à direita
- Cursor pointer, clicável
- Quando resolvido: checkmark + opacidade 50%

**Barra de progresso:** `<div>` de 4px, cor `#2FB2C0`, largura proporcional a missões resolvidas.

**Estado "Pipeline em dia":** Quando 5/5 resolvidas, mostra "Pipeline em dia ✓" centralizado, banner low-profile com opacidade reduzida nos cards.

---

### 3. Ação ao clicar nas missões

Cada missão, ao ser clicada:
- Faz scroll horizontal até a coluna correspondente no Kanban
- Aplica um flash visual (highlight temporário de 2s) nos cards relevantes

**Implementação:** O `KanbanBoard` passará uma ref ou callback `scrollToStage(stageId)` para o banner. O scroll usa `element.scrollIntoView({ behavior: 'smooth' })` na coluna-alvo. O highlight é feito via CSS class temporária nos cards (borda pulsante por 2s).

Missão 5 (briefings): ao clicar, abre o Drawer do primeiro lead com briefing incompleto.

---

### 4. Campo de briefing no Drawer

**Arquivo**: `src/components/admin/LeadDrawer.tsx`

Na aba Resumo, para leads em `call_agendada`, adicionar uma seção "Briefing" com:
- Textarea (min-h-[132px]) para notas do briefing
- Botão "Salvar" que grava em `leads.briefing_notes`
- Indicador visual se está vazio (badge "Pendente" em amarelo)

---

### 5. Gravar `call_date` ao agendar call

**Arquivo**: `src/components/admin/KanbanBoard.tsx`

Na action `schedule_call`, extrair a data escolhida no Google Calendar URL e gravá-la em `leads.call_date`. Se o usuário não informar data, usar `null`.

---

### 6. Visão do admin — Botão "Ver time"

**Arquivo**: `src/components/admin/MissionsBanner.tsx`

Botão discreto no canto direito do banner. Ao clicar, abre um popover/dialog com tabela:

| Usuário | Novos | Boas-Vindas | Agendamentos | Calls | Briefings |
|---------|-------|-------------|--------------|-------|-----------|

Cada célula colorida: verde (0), amarelo (1-2), vermelho (3+). Clicável para filtrar o Kanban por aquele usuário+coluna.

---

### 7. Integração no Proposals.tsx

**Arquivo**: `src/pages/admin/Proposals.tsx`

Renderizar `<MissionsBanner>` entre o header/filtros e o Kanban, passando:
- `leads` (filtrados ou todos, conforme escopo)
- `userId`
- `profiles` (para visão admin)
- `onScrollToStage` callback
- `onOpenLead` callback (para missão 5)

---

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| Migração SQL | `call_date` e `briefing_notes` na tabela leads |
| `MissionsBanner.tsx` | **Novo** — componente do banner com 5 missões |
| `Proposals.tsx` | Renderizar banner acima do Kanban |
| `KanbanBoard.tsx` | Expor ref/callback para scroll + gravar `call_date` |
| `LeadDrawer.tsx` | Campo briefing na aba Resumo para `call_agendada` |
| `LeadList.tsx` | Adicionar `call_date` e `briefing_notes` à interface Lead |

### Design system

- Cores: mesmas do CRM existente (`#2FB2C0`, `#F4A736`, `#EB626D`, hsl vars)
- Tipografia: `text-[13px]` para texto, número em `text-lg font-bold`
- Border-radius: `rounded-lg`
- Sem sombras pesadas — `border` sutil como os cards do Kanban
- Responsivo: flex-wrap em telas menores


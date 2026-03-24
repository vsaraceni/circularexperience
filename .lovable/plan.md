

## CRM v2.1 — UX Polish + Funcionalidades

### Resumo das mudanças

7 melhorias em 5 arquivos, sem alterações de banco.

---

### 1. Tooltips em todas as ações rápidas

**Arquivos**: `LeadCard.tsx`, `LeadDrawer.tsx`

Envolver cada botão de ação rápida com `<Tooltip>` + `<TooltipTrigger>` + `<TooltipContent>` (já existe em `@/components/ui/tooltip`). Textos descritivos:
- LinkedIn → "Buscar no LinkedIn"
- Copiar Zap → "Copiar telefone para WhatsApp"
- Agendar Call → "Abrir Google Agenda para agendar call"
- Elaborar Proposta → "Criar proposta comercial"
- Enviar Welcome → "Enviar e-mail de boas-vindas"
- Call Feita → "Registrar call realizada"
- Nutrir → "Mover para nutrição"
- Fechar → "Marcar como fechado"

Adicionar `<TooltipProvider>` no wrapper do `KanbanBoard`.

---

### 2. Botão "Agendar Call" abre Google Calendar

**Arquivo**: `KanbanBoard.tsx` (handler `schedule_call`)

Ao clicar, construir URL do Google Calendar:
```
https://calendar.google.com/calendar/render?action=TEMPLATE
  &text=Workshop imersivo Economia Circular
  &add={lead.email}
  &details=Call com {lead.name} - {lead.company}
```
Abrir em nova aba (`window.open`). Depois, mover lead para `call_agendada` e registrar atividade.

**Arquivo**: `LeadCard.tsx` — renomear label "Agendar" → "Agendar Call", ícone `Phone` → `CalendarPlus`.

---

### 3. Botão "Proposta" → "Elaborar Proposta"

**Arquivo**: `LeadCard.tsx` — alterar label em todos os estágios que mostram "Proposta" para "Elab. Proposta" (abreviado para caber no card).

**Arquivo**: `LeadDrawer.tsx` — alterar "Gerar Proposta" → "Elaborar Proposta".

---

### 4. Arquivar lead na edição

**Arquivo**: `LeadEditDialog.tsx`

Adicionar botão "Arquivar Lead" (variant destructive, com ícone `Archive`) no footer do dialog. Ao clicar:
- Confirmar com `window.confirm`
- Atualizar `status = 'archived'` e `kanban_stage = 'perdido'` (ou um novo valor que o filtro do Kanban exclui)
- Registrar atividade `lead_arquivado`
- O Kanban já filtra leads com `status = 'archived'` fora da query? Verificar e ajustar a query em `Proposals.tsx` para excluir `status = 'archived'` da busca de leads.

**Arquivo**: `Proposals.tsx` — adicionar `.neq('status', 'archived')` no fetch de leads do Kanban.

---

### 5. Ordenação de leads nas colunas

**Arquivo**: `KanbanBoard.tsx`

Adicionar estado `sortMode: 'arrival' | 'stale'` com toggle no topo do board (dois botões pequenos ou dropdown).
- **arrival** (padrão): ordenar por `created_at ASC` (mais antigos primeiro)
- **stale**: ordenar por `last_activity_at ASC` (mais parados primeiro — os "vermelhos" sobem)

Aplicar `sort()` no array de leads de cada coluna dentro do `useMemo`.

---

### 6. Cor do card baseada na urgência

**Arquivo**: `LeadCard.tsx`

Calcular os dias de inatividade (mesma lógica do `UrgencyBadge`) e aplicar classes dinâmicas no container do card:
- **0-2 dias**: `bg-emerald-500/5 border-emerald-500/20`
- **3-5 dias**: `bg-amber-500/5 border-amber-500/20`
- **> 5 dias**: `bg-red-500/5 border-red-500/20`
- **Sem data**: manter `bg-card border-border` (neutro)

Isso cria o mapa visual térmico sem alterar o badge existente.

---

### 7. Ícone "Agendar" → CalendarPlus

**Arquivo**: `LeadCard.tsx` — substituir `<Phone>` por `<CalendarPlus>` de lucide-react na ação `schedule_call`.

---

### Arquivos impactados

| Arquivo | Mudanças |
|---------|----------|
| `LeadCard.tsx` | Tooltips, labels, ícone calendar, cor dinâmica do card |
| `KanbanBoard.tsx` | Google Calendar URL, sort toggle, TooltipProvider |
| `LeadDrawer.tsx` | Tooltips, label "Elaborar Proposta" |
| `LeadEditDialog.tsx` | Botão "Arquivar Lead" |
| `Proposals.tsx` | Filtro `.neq('status','archived')` no fetch |

### Sem impacto em
- Tabelas / migrations (zero alteração de banco)
- Edge functions
- Landing page
- Fluxo de propostas existente


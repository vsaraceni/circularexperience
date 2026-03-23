

## CRM v2.0 — Fase 1: Kanban + Drawer + Toggle

### Resumo

Implementar o board Kanban de 8 estágios com drag & drop, drawer lateral de detalhes, toggle Lista/Kanban, e tabela de atividades — preservando 100% dos fluxos existentes (welcome email, gerar proposta, editar lead, arquivar).

---

### 1. Database Migration

Uma única migration com:

```sql
-- Novos campos em leads
ALTER TABLE leads ADD COLUMN kanban_stage text NOT NULL DEFAULT 'novo';
ALTER TABLE leads ADD COLUMN assigned_to uuid REFERENCES profiles(id);
ALTER TABLE leads ADD COLUMN assigned_at timestamptz;
ALTER TABLE leads ADD COLUMN stage_updated_at timestamptz DEFAULT now();
ALTER TABLE leads ADD COLUMN last_activity_at timestamptz;
ALTER TABLE leads ADD COLUMN linkedin_added boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN whatsapp_sent boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN lost_reason text;
ALTER TABLE leads ADD COLUMN lost_notes text;

-- Seed: mapear estágios a partir de dados existentes
UPDATE leads SET kanban_stage = 'boas_vindas' WHERE welcome_sent = true AND status NOT IN ('converted','archived');
UPDATE leads SET kanban_stage = 'proposta' WHERE status = 'converted';
UPDATE leads SET last_activity_at = COALESCE(welcome_sent_at, created_at);

-- Nova tabela lead_activities
CREATE TABLE lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id),
  activity_type text NOT NULL,
  content text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON lead_activities(lead_id);
CREATE INDEX ON lead_activities(created_at DESC);

-- RLS
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage activities" ON lead_activities FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Auth insert activities" ON lead_activities FOR INSERT TO authenticated
  WITH CHECK (true);

-- Seed atividades para leads existentes
INSERT INTO lead_activities (lead_id, activity_type, content, created_at)
  SELECT id, 'lead_recebido', 'Lead recebido via ' || origem, created_at FROM leads;
```

Zero risco para dados existentes — tudo aditivo, campo `status` mantido intacto.

---

### 2. Novos Componentes (7 arquivos)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `KanbanBoard.tsx` | Container horizontal com 8 colunas, scroll, contadores por estágio. Usa `@dnd-kit/core` para drag & drop. Ao dropar: atualiza `kanban_stage` + `stage_updated_at` + insere atividade `stage_mudou`. |
| `KanbanColumn.tsx` | Coluna droppable com header (nome + count + cor) e lista de LeadCards. |
| `LeadCard.tsx` | Card arrastável com: empresa, contato, badge de urgência (verde/amarelo/vermelho por dias desde `last_activity_at`), avatar do responsável, e botões de ação rápida por estágio. |
| `LeadDrawer.tsx` | Sheet lateral (direita) com dados do lead, ações rápidas (welcome, proposta, LinkedIn, WhatsApp), e timeline de atividades. |
| `ActivityTimeline.tsx` | Lista cronológica de `lead_activities` com ícones por `activity_type`. |
| `LostDialog.tsx` | Dialog para registrar motivo de perda (dropdown + textarea). |
| `UrgencyBadge.tsx` | Badge: verde (< 2 dias), amarelo (3-5 dias), vermelho (> 5 dias) desde última atividade. |

---

### 3. Modificações em Arquivos Existentes

**`src/pages/admin/Proposals.tsx`**
- Adicionar estado `viewMode: 'list' | 'kanban'` com toggle no header (ícones LayoutGrid / List).
- Atualizar `fetchLeads` para trazer todos os leads (incluindo `kanban_stage`, `assigned_to`, `last_activity_at`) — remover filtro de status para o Kanban, manter filtro para a lista.
- Quando `viewMode === 'kanban'`, renderizar `<KanbanBoard>` no lugar das Tabs. Tabs continuam como fallback.
- Passar `user.id` e `authorDefaults` ao KanbanBoard para atribuição automática.

**`src/components/admin/LeadList.tsx`**
- Atualizar interface `Lead` com novos campos (`kanban_stage`, `assigned_to`, `last_activity_at`).
- Em `handleSendWelcome`: após sucesso, também atualizar `kanban_stage = 'boas_vindas'`, `assigned_to = user.id`, `assigned_at = now()`, `last_activity_at = now()` e inserir atividade.

**`src/components/admin/LeadEditDialog.tsx`**
- Sem mudanças estruturais, apenas importar `Lead` atualizado.

---

### 4. Estágios e Ações Rápidas

```text
Estágio        Ações no Card/Drawer
─────────────  ──────────────────────────────
Novo           [Enviar Welcome] [Gerar Proposta]
Boas-Vindas    [LinkedIn ✓] [WhatsApp] [Proposta]
Em Contato     [Agendar Call] [Proposta]
Call Agendada  [Call Feita] [Proposta]
Proposta       [Nutrir] [Fechar] [Perdido]
Nutrição       [Proposta] [Fechar] [Perdido]
Fechado        (final — sem ações)
Perdido        (final — reabrir)
```

Cada ação rápida: atualiza `kanban_stage` + `last_activity_at` + insere `lead_activity`.

---

### 5. Dependência

- Instalar `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`

---

### 6. O que NÃO muda

- `ProposalForm.tsx`, `ProposalList.tsx` — intactos
- `EmailTemplateEditor.tsx`, `ProfileEditor.tsx` — intactos
- Edge functions (`send-welcome-email`, `generate-pdf`, `send-lead-email`) — intactas
- Landing page — intacta
- Campo `status` na tabela `leads` — mantido em paralelo

---

### 7. Ordem de Implementação

1. Rodar migration (banco)
2. Instalar `@dnd-kit`
3. Criar `UrgencyBadge`, `ActivityTimeline`, `LostDialog` (componentes isolados)
4. Criar `LeadCard`, `KanbanColumn`, `KanbanBoard`
5. Criar `LeadDrawer`
6. Atualizar `Proposals.tsx` com toggle e integração
7. Atualizar `LeadList.tsx` com side-effects no welcome


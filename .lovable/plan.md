

## CRM Kanban: Ações por Estágio + Fluxo Perdido

### Resumo

Reescrever as ações dos cards do Kanban para refletir a jornada real, implementar fluxo de leads perdidos com ícone ✕ nos cards, e criar view de perdidos.

### Mudanças

#### 1. Migration: coluna `closed_at` em `leads`
```sql
ALTER TABLE leads ADD COLUMN closed_at timestamptz;
```
Necessária para registrar data de fechamento exibida no card "Fechado".

#### 2. Migration: tabela `proposal_submissions`
Registra envios de proposta (data, canal, observação):
```sql
CREATE TABLE proposal_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  proposal_id uuid,
  sent_at date NOT NULL DEFAULT CURRENT_DATE,
  channels text[] NOT NULL DEFAULT '{}',
  notes text DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE proposal_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage submissions" ON proposal_submissions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
```

#### 3. `LeadCard.tsx` — Reescrever ações + ícone ✕

- **Novo**: apenas "Enviar Boas-Vindas"
- **Boas-Vindas**: "LinkedIn" + "Copiar Zap"
- **Em Contato**: apenas "Agendar Call"
- **Call Agendada**: apenas "Call Realizada"
- **Proposta**: "Elab. Proposta" + "Registrar Envio" (condicional: só aparece se existe proposta vinculada — receber `proposals` como prop)
- **Nutrição**: "Registrar Contato" + "Fechar"
- **Fechado**: sem ações, exibir `closed_at` abaixo do nome da empresa

Adicionar ícone ✕ (X cinza, canto superior direito) nos estágios `em_contato`, `call_agendada`, `proposta`, `nutricao`. Tooltip: "Marcar como perdido". Ao clicar: `onQuickAction(lead, "mark_lost")`.

#### 4. `KanbanBoard.tsx` — Novos handlers

- **`send_welcome`**: envia e-mail + move para `boas_vindas` (já existe via `onSendWelcome`)
- **`schedule_call`**: abre Google Calendar + move para `call_agendada` (já existe)
- **`call_done`**: move para `proposta` (já existe)
- **`register_submission`**: abre modal `SubmissionDialog`, ao confirmar salva em `proposal_submissions`, move para `nutricao`
- **`register_contact`**: abre modal inline com campo de texto, salva nota + atualiza `last_activity_at`
- **`close_won`**: move para `fechado`, grava `closed_at` (atualizar handler existente)
- **`mark_lost`**: abre `LostDialog` (já existe)

Remover coluna "Perdido" do STAGES array (7 colunas, não 8). Filtrar leads perdidos do Kanban.

Passar `proposals` ao `LeadCard` para condicionar "Registrar Envio".

#### 5. `LostDialog.tsx` — Atualizar motivos

Substituir os 6 motivos atuais por:
1. Sem resposta
2. Preço fora do orçamento
3. Escolheu outro fornecedor
4. Projeto cancelado ou adiado
5. Sem fit com o produto
6. Timing — pode voltar no futuro

Mudar título para "Por que este lead foi perdido?". Confirmar desabilitado até selecionar motivo (já funciona assim).

#### 6. Novo componente `SubmissionDialog.tsx`

Modal com:
- Datepicker "Quando foi enviada?" (padrão hoje)
- Checkboxes: E-mail / WhatsApp (obrigatório ≥1)
- Textarea "Observação" (opcional)
- Botões Cancelar / Confirmar envio

#### 7. Novo componente `ContactDialog.tsx`

Modal simples com campo de texto "O que foi feito?" + Salvar.

#### 8. Novo componente `LostLeadsView.tsx`

Tabela com colunas: nome, empresa, responsável, motivo, data da perda, observação.
Filtro por motivo no topo. Botão "Reativar" por linha (move para `em_contato`).

#### 9. `Proposals.tsx` — Botão "Ver Perdidos"

Adicionar botão ao lado de "Nova Proposta" no header do Pipeline. Ao clicar, renderiza `LostLeadsView` no lugar do Kanban (toggle).

#### 10. `LeadDrawer.tsx` — Alinhar ações

Atualizar seção "Ações Rápidas" para refletir as mesmas ações dos cards (sem ações extras que não existem no card).

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| 2 migrations | `closed_at` + `proposal_submissions` |
| `LeadCard.tsx` | Reescrever ações, ícone ✕, prop proposals, exibir closed_at |
| `KanbanBoard.tsx` | Remover coluna Perdido, novos handlers, passar proposals ao card |
| `KanbanColumn.tsx` | Repassar proposals ao LeadCard |
| `LostDialog.tsx` | Novos motivos, novo título |
| `SubmissionDialog.tsx` | Novo componente |
| `ContactDialog.tsx` | Novo componente |
| `LostLeadsView.tsx` | Novo componente |
| `LeadDrawer.tsx` | Alinhar ações com os cards |
| `Proposals.tsx` | Botão "Ver Perdidos", filtrar perdidos do Kanban |
| `LeadList.tsx` | Adicionar `closed_at` ao type Lead |


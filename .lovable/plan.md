

## CRM Pipeline: Leads → Propostas → Fechadas/Perdidas

### Situação Atual
- Leads chegam pela LP via formulário (nome, email, cargo, empresa) mas **não são salvos no banco** — apenas enviam email via Resend.
- Propostas existem na tabela `proposals` sem nenhum campo de status ou vínculo com leads.
- A página admin (`/admin/propostas`) lista propostas sem pipeline.

### Plano de Implementação

#### 1. Banco de Dados — Duas migrações

**Migração 1: Criar tabela `leads`**
```sql
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  cargo text DEFAULT '',
  company text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'new'  -- 'new', 'converted'
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Anon pode inserir (formulário público)
CREATE POLICY "Anyone can insert leads"
  ON public.leads FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Apenas admin lê
CREATE POLICY "Admins can read leads"
  ON public.leads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin pode atualizar status
CREATE POLICY "Admins can update leads"
  ON public.leads FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

**Migração 2: Adicionar `status` e `lead_id` na tabela `proposals`**
```sql
ALTER TABLE public.proposals
  ADD COLUMN status text NOT NULL DEFAULT 'enviada',
  ADD COLUMN lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;
```
Status possíveis: `enviada`, `fechada`, `perdida`.

#### 2. Edge Function `send-lead-email` — Salvar lead no banco

Atualizar para **inserir o lead na tabela `leads`** antes de enviar o email. Usar o service role key do Supabase para o insert (já que o caller é anônimo via edge function).

#### 3. Nova Página Admin com Tabs: Pipeline CRM

Refatorar `/admin/propostas` para uma página com **4 abas** usando Tabs do shadcn:

```text
┌──────────┬────────────┬──────────┬──────────┐
│  LEADS   │ PROPOSTAS  │ FECHADAS │ PERDIDAS │
└──────────┴────────────┴──────────┴──────────┘
```

**Aba LEADS:**
- Lista todos os leads da tabela `leads` (status = 'new'), mais recentes primeiro
- Cada card mostra: nome, email, cargo, empresa, data de entrada
- Botão "Gerar Proposta" em cada lead → abre o ProposalForm pré-preenchido com `company_name`, `contact_name`, `contact_role` do lead, e salva o `lead_id` na proposta
- Ao gerar proposta, o lead muda para status `converted`

**Aba PROPOSTAS (status = 'enviada'):**
- Lista propostas existentes filtradas por `status = 'enviada'`
- Cada card tem os botões existentes (copiar link, ver, editar, PDF, excluir)
- Adicionar botões de ação de status: "Marcar como Fechada" e "Marcar como Perdida"

**Aba FECHADAS (status = 'fechada'):**
- Lista propostas com `status = 'fechada'`
- Possibilidade de reverter para 'enviada'

**Aba PERDIDAS (status = 'perdida'):**
- Lista propostas com `status = 'perdida'`
- Possibilidade de reverter para 'enviada'

#### 4. Componentes Novos/Modificados

| Arquivo | Ação |
|---|---|
| `src/pages/admin/Proposals.tsx` | Refatorar para CRM com tabs |
| `src/components/admin/LeadList.tsx` | **Novo** — lista de leads com ação "Gerar Proposta" |
| `src/components/admin/ProposalList.tsx` | Adicionar badges de status e botões de transição |
| `src/components/admin/ProposalForm.tsx` | Aceitar dados pré-preenchidos de um lead + campo `lead_id` |
| `supabase/functions/send-lead-email/index.ts` | Inserir lead no banco antes de enviar email |

#### 5. Fluxo Completo

```text
Visitante preenche LP → Lead salvo no banco + email enviado
                              ↓
Admin abre aba LEADS → vê todos os leads novos
                              ↓
Clica "Gerar Proposta" → Form abre pré-preenchido
                              ↓
Salva proposta (status='enviada', lead_id vinculado, lead→converted)
                              ↓
Aba PROPOSTAS → vê proposta, compartilha link/PDF
                              ↓
Marca como FECHADA ou PERDIDA → move para aba correspondente
```


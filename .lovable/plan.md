

## Plano: Status "Rascunho", Assinatura Automática e Perfil Admin

### 1. Novo status `rascunho` para propostas

Atualmente propostas nascem com status `enviada`. O correto é nascerem como `rascunho` e o admin marcar manualmente como `enviada`.

**Banco de dados:** Migração para alterar o default:
```sql
ALTER TABLE public.proposals ALTER COLUMN status SET DEFAULT 'rascunho';
```

**Pipeline com 5 abas:**
```
┌────────┬───────────┬───────────┬──────────┬──────────┐
│ LEADS  │ RASCUNHOS │ ENVIADAS  │ FECHADAS │ PERDIDAS │
└────────┴───────────┴───────────┴──────────┴──────────┘
```

- Aba **Rascunhos** (`status = 'rascunho'`): propostas recém-criadas, com botão "Marcar como Enviada"
- Aba **Enviadas**: com botões "Fechada" e "Perdida"
- Abas **Fechadas/Perdidas**: com botão reverter

**Arquivos:** `Proposals.tsx` (nova tab + filtro), `ProposalList.tsx` (adicionar status `rascunho` no config e ações de transição)

### 2. Perfil admin com cargo e telefone

**Banco de dados:** Migração para adicionar colunas na tabela `profiles`:
```sql
ALTER TABLE public.profiles
  ADD COLUMN cargo text DEFAULT '',
  ADD COLUMN phone text DEFAULT '';
```

**UI:** Adicionar um botão "Meu Perfil" no header do CRM que abre um pequeno formulário/modal para o admin editar `full_name`, `cargo`, `phone` e `email`. Componente novo: `src/components/admin/ProfileEditor.tsx`.

### 3. Assinatura auto-preenchida no ProposalForm

Ao abrir o formulário de nova proposta, buscar o perfil do admin logado (`profiles` table) e pré-preencher:
- `author_name` ← `profiles.full_name`
- `author_email` ← `profiles.email`  
- `author_phone` ← `profiles.phone`

O `ProposalForm` receberá uma nova prop `authorDefaults` com esses valores. Ao editar proposta existente, mantém os valores salvos.

### Resumo de alterações

| Arquivo | Mudança |
|---|---|
| **Migração SQL** | Default `rascunho` + colunas `cargo`, `phone` em profiles |
| `Proposals.tsx` | 5 abas, fetch profile para defaults de assinatura, botão "Meu Perfil" |
| `ProposalList.tsx` | Status `rascunho` no config, ações de transição rascunho→enviada |
| `ProposalForm.tsx` | Receber `authorDefaults` e pré-preencher assinatura |
| `ProfileEditor.tsx` | **Novo** — modal para editar nome, cargo, telefone, email |


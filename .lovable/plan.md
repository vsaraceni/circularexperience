

## Visualizar e Alterar Proprietário do Lead

### O que será feito

1. **Avatar do proprietário no LeadCard** — exibir avatar/iniciais do responsável no card do Kanban (já existe `assigned_to`, falta exibir o nome/avatar).

2. **Nome do proprietário no LeadDrawer** — na aba Resumo, mostrar linha "Responsável: Nome do Usuário".

3. **Dropdown de reatribuição no LeadDrawer** — abaixo do nome do responsável, um `<Select>` com lista de admins (query em `profiles` + `user_roles`) para reatribuir. Ao mudar: atualizar `assigned_to` + `assigned_at` + registrar atividade `lead_reatribuido`.

### Fluxo de dados

- `Proposals.tsx` já faz fetch de `profiles` (para filtro de responsável). Passar esse array ao `KanbanBoard` → `LeadDrawer`.
- `LeadCard` recebe `profiles` para resolver `assigned_to` → iniciais do avatar.

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `LeadCard.tsx` | Exibir avatar/iniciais do `assigned_to` usando array de profiles |
| `LeadDrawer.tsx` | Linha "Responsável" + Select para reatribuir |
| `KanbanBoard.tsx` | Repassar `profiles` ao LeadCard e LeadDrawer |
| `Proposals.tsx` | Passar `profiles` ao KanbanBoard |

### Sem alteração de banco
Campos `assigned_to` e `assigned_at` já existem na tabela `leads`.


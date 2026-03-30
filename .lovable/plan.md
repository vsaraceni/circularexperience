

## 4 Melhorias no CRM Pipeline

### 1. Aumentar altura dos boxes de mensagens no Drawer (min-h para 6 linhas)

**Arquivo**: `src/components/admin/LeadDrawer.tsx`

Na Textarea dos templates (linha ~407), trocar `min-h-[80px]` por `min-h-[132px]` (~6 linhas de texto em 12px com leading-relaxed). Aplica-se a todos os templates de todas as etapas igualmente.

### 2. Painel de variáveis no topo do admin de Templates

**Arquivo**: `src/pages/admin/Templates.tsx`

Adicionar um bloco informativo no topo do `<main>`, antes da listagem de estágios, com todas as variáveis disponíveis organizadas em 2 grupos:

- **Automáticas** (substituídas pelo sistema): `{{nome}}`, `{{empresa}}`, `{{cargo}}`, `{{nome_especialista}}`, `{{cargo_especialista}}`, `{{data_envio_proposta}}`
- **Manuais** (preenchidas pelo usuário antes de copiar): `{{dia1}}`, `{{dia2}}`, `{{horário}}`, `{{mês}}`, `{{prazo}}`

Estilo: Card com fundo sutil, badges clicáveis que copiam a variável para o clipboard com toast de confirmação. Similar ao que já existe no `EmailTemplateEditor` com `VARIABLES_LEAD`.

### 3. Botão "Ver Perdidos" → menu "três pontinhos"

**Arquivo**: `src/pages/admin/Proposals.tsx`

Substituir o `<Button>` "Ver Perdidos" por um `DropdownMenu` com trigger de ícone `MoreVertical` (três pontinhos). Dentro, uma `DropdownMenuItem` "Ver Leads Perdidos" com ícone `Eye`. O botão "Nova Proposta" permanece como está.

### 4. Deletar leads de teste na tela de Perdidos

**Arquivos**: `src/components/admin/LostLeadsView.tsx` + migração SQL

- Adicionar coluna de ação com botão `Trash2` visível apenas para leads cujo email termina em `@atinaedu.com.br` ou `@movimentocircular.io`
- Ao clicar, dialog de confirmação ("Este lead parece ser de teste. Deseja excluir permanentemente?")
- Executar `supabase.from("leads").delete().eq("id", id)` + deletar atividades e follow-ups associados
- **Migração**: Adicionar política RLS de DELETE na tabela `leads` restrita a admins:
  ```sql
  CREATE POLICY "Admins can delete leads"
  ON public.leads FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
  ```

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `LeadDrawer.tsx` | min-h da Textarea → 132px |
| `Templates.tsx` | Bloco de variáveis no topo |
| `Proposals.tsx` | Botão perdidos → DropdownMenu 3 pontinhos |
| `LostLeadsView.tsx` | Botão deletar para emails de teste + dialog |
| Migração SQL | DELETE policy em leads |


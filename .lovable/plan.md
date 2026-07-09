# PRD — Aprovação manual de contas no CRM

## Problema
Hoje qualquer pessoa pode criar conta pela tela de login. O `ProtectedRoute` já barra acesso ao CRM se o usuário não tiver linha em `user_roles`, mas não existe (a) fluxo formal de aprovação, (b) notificação para o admin, (c) tela para liberar/rejeitar/gerenciar usuários. O usuário fica em limbo silencioso e o admin não sabe que precisa agir.

## Objetivo
Fluxo simples e seguro: qualquer cadastro entra como **pendente**, admin é notificado, admin aprova (definindo o papel) ou rejeita numa tela dedicada. Só após aprovação a pessoa acessa o CRM.

## Escopo

### 1. Banco (migration)
- `profiles`: adicionar
  - `approval_status text not null default 'pending'` (valores: `pending` | `approved` | `rejected`)
  - `approved_at timestamptz`
  - `approved_by uuid references auth.users(id)`
  - `rejection_reason text`
- Backfill: todos os profiles que **já têm linha em `user_roles`** viram `approved`; os demais viram `pending`. Garante que ninguém em produção seja deslogado.
- Trigger `handle_new_user` (já existe): manter criação do profile; adicionar `INSERT INTO notifications` para cada admin (via `user_roles.role='admin'`) do tipo `new_user_pending` com `title = "Novo cadastro aguardando aprovação: <email>"`. Reaproveita o `notify_new_lead` como referência de padrão (SECURITY DEFINER, exception-safe).
- Função `approve_user(_user_id uuid, _role app_role, _role_label text)` SECURITY DEFINER:
  - checa `is_admin(auth.uid())`;
  - insert em `user_roles` (on conflict do nothing);
  - atualiza `profiles` com status/approved_at/approved_by/role_label.
- Função `reject_user(_user_id uuid, _reason text)` SECURITY DEFINER: checa admin, seta status=`rejected`, apaga `user_roles` do alvo se existir.
- RLS `profiles`: manter policies existentes; adicionar policy que permite admins fazerem `SELECT` de todos os profiles (para a tela de gestão). Update de status só via as funções acima.
- GRANTs padrão nas funções para `authenticated`.

### 2. Frontend

**`ProtectedRoute`**
- Passa a checar também `profiles.approval_status`. Se `user` existe mas status ≠ `approved`, redirecionar para `/login?pending=1` (e fazer `signOut` opcional? — melhor manter sessão e mostrar mensagem, já que a aprovação pode chegar durante a mesma sessão).
- Mantém `requireAdmin` inalterado.

**`useAuth`**
- Além de `hasRole`/`isAdmin`, expor `approvalStatus: 'pending'|'approved'|'rejected'|null` lido junto com o role.

**`Login.tsx`**
- Se `user && approvalStatus === 'pending'`: renderiza card "Cadastro recebido — aguarde liberação do administrador" com botão "Sair".
- Se `rejected`: mensagem correspondente + botão Sair.
- Fluxo de cadastro em si continua igual; só troca a toast final para "Cadastro enviado. Aguarde aprovação do administrador."

**Nova página `/admin/usuarios`** (só admin, via `ProtectedRoute requireAdmin`)
- Tabs/seções: **Pendentes** (destaque), **Aprovados**, **Rejeitados**.
- Cada linha: nome, email, data do cadastro, cargo (se informado). Ações:
  - **Aprovar** → dialog escolhe papel (`user` ou `admin`) e `role_label` livre (ex.: SDR, Closer). Chama `approve_user`.
  - **Rejeitar** → dialog com motivo opcional. Chama `reject_user`.
  - Nos aprovados: botão "Revogar acesso" (chama `reject_user`, remove user_roles).
- Badge no `NotificationBell` já cobre a notificação em tempo real (reaproveita tabela `notifications`).

**Navegação** (`CrmNavbar` dropdown do avatar): novo item admin "Usuários" acima de "Produtos".

### 3. Segurança
- Nenhuma escrita direta em `user_roles` pelo cliente — sempre via RPC SECURITY DEFINER que valida `is_admin`.
- `profiles.approval_status` não é editável por policy — só pelas funções.
- `handle_new_user` continua inserindo profile mesmo se a notificação falhar (bloco EXCEPTION).
- Nada muda para usuários já ativos (backfill).

### 4. Fora de escopo (agora)
- Email transacional de aprovação/rejeição.
- Convite direto pelo admin (criar usuário sem signup).
- Auditoria detalhada (log de quem aprovou já fica em `approved_by`).

## Detalhes técnicos

Arquivos afetados:
- `supabase/migrations/*` — nova migration (colunas + trigger update + funções + policy).
- `src/hooks/useAuth.tsx` — expor `approvalStatus`.
- `src/components/auth/ProtectedRoute.tsx` — checar status.
- `src/pages/Login.tsx` — tela "aguardando aprovação".
- `src/pages/admin/Users.tsx` — nova página.
- `src/App.tsx` — rota `/admin/usuarios`.
- `src/components/admin/CrmNavbar.tsx` — item no dropdown.
- `src/components/admin/NotificationBell.tsx` — mapear tipo `new_user_pending` para link `/admin/usuarios`.

## Caminho de teste
1. Criar conta nova em `/login` → toast "aguarde aprovação"; se logar de novo, cai na tela de espera.
2. Como admin, sino mostra notificação "Novo cadastro aguardando aprovação".
3. `/admin/usuarios` → aprovar escolhendo papel → usuário atualiza e ganha acesso ao CRM.
4. Rejeitar/revogar → usuário perde acesso na próxima navegação.

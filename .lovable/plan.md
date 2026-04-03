

## Ajustes: Roles de Usuário + Central de Templates de Email

### Item 1 — Definir roles (admin vs usuário)

**Situação atual:** Todos os 3 usuários (vinicius@movimentocircular.io, alinye@movimentocircular.io, livia@atinaedu.com.br) têm role `admin`.

**Ação:** Alterar o role de Alinye e Lívia de `admin` para `user` na tabela `user_roles`, mantendo apenas Vinicius como admin.

> **Nota:** O email no banco é `vinicius@movimentocircular.io` (não `@atinaedu.com.br`). Confirme se é esse o usuário correto.

**Impacto:** Alinye e Lívia continuarão acessando o CRM (o `ProtectedRoute` com `requireAdmin` controla acesso). Precisaremos revisar se as rotas admin devem ser acessíveis a `user` também — caso contrário, elas perderão acesso ao Kanban. Se a intenção é que todos acessem o CRM mas só o admin veja configurações, ajustaremos o `ProtectedRoute` para permitir `user` nas rotas operacionais.

### Item 2 — Central de Templates de Email no dropdown do avatar

**Atualmente:** O dropdown do avatar tem um botão "Email de Boas-Vindas" que abre um editor do template de boas-vindas (salvo no banco, tabela `email_templates`).

**Proposta:** Substituir por um item "Configurar Emails" que abre um Dialog com abas/tabs mostrando todos os templates:

| Template | Tipo | Editável? |
|----------|------|-----------|
| Email de Boas-Vindas | DB (`email_templates`) | Sim — editor existente |
| Digest Matinal (Missões) | React Email (code) | Preview apenas |
| Alerta de Proposta | React Email (code) | Preview apenas |
| Performance Diária | React Email (code) | Preview apenas |

- Os 3 templates transacionais são renderizados via a edge function `preview-transactional-email` existente, que retorna o HTML renderizado
- Cada aba mostra o preview em iframe + informações (assunto, destinatário, gatilho)
- O template de boas-vindas mantém o editor atual completo

### Detalhes técnicos

**Arquivos afetados:**

| Arquivo | Ação |
|---------|------|
| `src/components/admin/EmailTemplateEditor.tsx` | Refatorar: transformar em central de emails com Tabs |
| `src/pages/admin/Proposals.tsx` | Trocar label do menu de "Email de Boas-Vindas" para "Configurar Emails" |
| Dados `user_roles` | UPDATE para mudar roles de Alinye e Lívia |

**Lógica do preview transacional:**
- Chamar `supabase.functions.invoke('preview-transactional-email', { body: { templateName } })` para cada template
- Exibir o HTML retornado em um iframe sandboxed
- Mostrar metadados: subject, destinatário padrão, descrição do gatilho


# Roadmap

## Em andamento — Templates e e-mails para toda a equipe
- [x] RLS: leitura de `email_template_overrides` e `email_templates` para membros do CRM; escrita para `manage_templates`/admin
- [ ] Função de prévia de e-mails: aceitar qualquer membro aprovado (regressão do scaffold: só aceitava API key) e devolver campos editáveis + overrides
- [ ] Rota `/admin/templates` aberta a todo usuário aprovado
- [ ] Menu "Templates de Mensagem" visível para todos
- [ ] `Templates.tsx`: modo consulta (copiar, expandir) vs. modo edição
- [ ] `EmailTemplateEditor.tsx`: 6 abas para todos; campos globais somente leitura para quem não edita
- [ ] `LeadDrawer.tsx`: botão "Ver todos os templates" / "Gerenciar templates"
- [ ] Testes E2E: usuária comum (Lívia) e admin (Vinicius)

## Pronto para fazer
- Página de templates: filtro por canal (WhatsApp / E-mail / LinkedIn) além do filtro por produto
- Central de Emails: histórico de alterações dos textos globais (quem alterou, quando)

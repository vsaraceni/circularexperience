# Roadmap

## Concluído — Templates e e-mails para toda a equipe (out/2026)
- [x] RLS: leitura de `email_template_overrides` e `email_templates` para membros do CRM; escrita para `manage_templates`/admin
- [x] Função de prévia de e-mails aceita qualquer membro aprovado e devolve campos editáveis + overrides (regressão do scaffold corrigida)
- [x] Rota `/admin/templates` aberta a todo usuário aprovado; menu "Templates de Mensagem" visível para todos
- [x] `Templates.tsx`: modo consulta (copiar, expandir, busca, filtro por canal) vs. modo edição
- [x] `EmailTemplateEditor.tsx`: 6 abas para todos; campos globais somente leitura para quem não edita; "Restaurar padrão" agora apaga de fato
- [x] `LeadDrawer.tsx`: botão "Ver todos os templates" / "Gerenciar templates"
- [x] E2E (Playwright): admin 30/30, usuária comum 36/36; teste unitário permanente em `src/pages/admin/Templates.test.tsx`

## Pronto para fazer
- Central de Emails: histórico de alterações dos textos globais (quem alterou, quando)
- Página de templates: contador de uso por template (quantas vezes copiado/enviado) para orientar a curadoria
- Modo consulta: atalho "Personalizar minha versão" que abre o painel do lead já no bloco Mensagens

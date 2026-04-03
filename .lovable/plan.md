

## Tornar Templates Transacionais Editáveis pelo Admin

### Problema
Os 3 templates transacionais (Digest, Alerta, Performance) são 100% código — o admin não pode ajustar nem o texto de saudação, assunto ou CTA.

### Solução
Criar um sistema de **overrides de texto** armazenados no banco, onde o admin edita campos-chave de cada template pela Central de Emails, sem tocar em código.

### Como funciona

1. **Nova tabela `email_template_overrides`**
   - `template_name` (PK, text) — ex: `daily-digest`
   - `overrides` (jsonb) — ex: `{"greeting": "Bom dia, time!", "cta_text": "Resolver agora"}`
   - `updated_at` (timestamp)

2. **Campos editáveis por template**

| Template | Campos editáveis |
|----------|-----------------|
| daily-digest | greeting, cta_text, resolved_title, resolved_text, footer |
| call-scheduled-alert | title, subtitle, cta_text, no_briefing_warning, footer |
| daily-performance | title, footer |

3. **Fluxo de envio**
   - `send-transactional-email` e `check-notifications` buscam overrides do banco antes de renderizar
   - Passam os overrides como props adicionais para o componente React Email
   - Cada template usa o override se existir, senão mantém o default hardcoded

4. **UI na Central de Emails**
   - Substituir "Somente visualização" por formulário com os campos editáveis
   - Cada campo mostra placeholder com o valor default do código
   - Botão "Salvar" grava no banco
   - Preview ao vivo: após salvar, recarrega o iframe com os novos textos

5. **Preview transacional com overrides**
   - `preview-transactional-email` também busca overrides do banco para renderizar o preview fidedigno

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| Migração SQL | Criar tabela `email_template_overrides` com RLS |
| `daily-digest.tsx` | Aceitar props de override com fallback |
| `call-scheduled-alert.tsx` | Aceitar props de override com fallback |
| `daily-performance.tsx` | Aceitar props de override com fallback |
| `send-transactional-email/index.ts` | Buscar overrides do banco antes de render |
| `check-notifications/index.ts` | Buscar overrides e passar como templateData |
| `preview-transactional-email/index.ts` | Buscar overrides para preview |
| `src/components/admin/EmailTemplateEditor.tsx` | Formulário de edição por template |

### Segurança
- Somente `admin` pode ler/escrever na tabela de overrides (RLS com `has_role`)
- Valores são escapados automaticamente pelo React (sem `dangerouslySetInnerHTML`)


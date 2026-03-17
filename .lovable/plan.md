

## Plano: Configurar Dados do Remetente

### Situação Atual
O remetente está hardcoded na edge function: `"Circular Experience <contato@lovable.movimentocircular.io>"`. O domínio verificado para envio é `notify.escolas.movimentocircular.io`.

### Implementação

#### 1. Banco de Dados — Tabela `email_templates` com campos de remetente

Criar a tabela `email_templates` (já planejada) incluindo campos de remetente:

```sql
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  subject text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  from_name text NOT NULL DEFAULT 'Circular Experience',
  from_email text NOT NULL DEFAULT 'contato@notify.escolas.movimentocircular.io',
  reply_to text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email templates"
  ON public.email_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.email_templates (slug, subject, body_html, from_name, from_email, reply_to)
VALUES (
  'lead-welcome',
  'Obrigado pelo seu interesse, {{name}}!',
  '<p>Olá <strong>{{name}}</strong>,</p><p>Obrigado pelo contato em nome da <strong>{{company}}</strong>. Recebemos sua solicitação e em breve entraremos em contato.</p><p>Atenciosamente,<br>Equipe Movimento Circular</p>',
  'Circular Experience',
  'contato@notify.escolas.movimentocircular.io',
  'contato@movimentocircular.io'
);
```

Os campos `from_name`, `from_email` e `reply_to` permitem ao admin configurar o remetente e o email de resposta.

#### 2. Edge Function `send-lead-email` — Usar template do banco

Atualizar para:
- Buscar template `lead-welcome` da tabela `email_templates`
- Usar `from_name` e `from_email` do template como remetente
- Usar `reply_to` se configurado
- Substituir variáveis `{{name}}`, `{{company}}`, `{{cargo}}`, `{{email}}`
- Enviar email de boas-vindas **para o lead** além da notificação interna

#### 3. Frontend — `EmailTemplateEditor.tsx`

Novo componente (dialog) acessível pelo header do CRM com:
- Campo **Nome do Remetente** (Input)
- Campo **Email do Remetente** (Input — limitado ao domínio verificado)
- Campo **Responder Para** (Input — qualquer email, ex: contato@movimentocircular.io)
- Campo **Assunto** (Input)
- Campo **Corpo do Email** (RichTextEditor existente)
- Chips com variáveis disponíveis: `{{name}}`, `{{email}}`, `{{company}}`, `{{cargo}}`

#### Resumo de Alterações

| Arquivo | Mudança |
|---|---|
| Migração SQL | Criar `email_templates` com campos de remetente + template padrão |
| `send-lead-email/index.ts` | Buscar template, usar remetente configurável, enviar email ao lead |
| `EmailTemplateEditor.tsx` | **Novo** — dialog para editar template + dados do remetente |
| `Proposals.tsx` | Adicionar botão "Email de Boas-Vindas" no header do CRM |


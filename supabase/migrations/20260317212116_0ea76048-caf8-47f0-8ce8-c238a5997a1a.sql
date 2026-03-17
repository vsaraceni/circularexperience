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
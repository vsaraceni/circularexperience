
-- Table: message_templates (global templates managed by admin)
CREATE TABLE public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email', 'whatsapp', 'linkedin')),
  title text NOT NULL,
  subject text,
  body text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: user_template_overrides (per-user customizations)
CREATE TABLE public.user_template_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.message_templates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (template_id, user_id)
);

-- RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_template_overrides ENABLE ROW LEVEL SECURITY;

-- message_templates: admins full access, authenticated can read
CREATE POLICY "Admins manage message templates"
  ON public.message_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read active templates"
  ON public.message_templates FOR SELECT TO authenticated
  USING (is_active = true);

-- user_template_overrides: users manage own, admins see all
CREATE POLICY "Users manage own overrides"
  ON public.user_template_overrides FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins read all overrides"
  ON public.user_template_overrides FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_message_templates_stage ON public.message_templates(stage);
CREATE INDEX idx_user_template_overrides_user ON public.user_template_overrides(user_id);
CREATE INDEX idx_user_template_overrides_template ON public.user_template_overrides(template_id);


CREATE TABLE public.email_template_overrides (
  template_name TEXT PRIMARY KEY,
  overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_template_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read overrides"
ON public.email_template_overrides FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert overrides"
ON public.email_template_overrides FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update overrides"
ON public.email_template_overrides FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

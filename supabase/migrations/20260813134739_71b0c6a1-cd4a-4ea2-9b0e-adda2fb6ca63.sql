CREATE TABLE public.user_email_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_slug text NOT NULL,
  subject text,
  body_html text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, template_slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_email_overrides TO authenticated;
GRANT ALL ON public.user_email_overrides TO service_role;

ALTER TABLE public.user_email_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own email overrides"
ON public.user_email_overrides
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins read all email overrides"
ON public.user_email_overrides
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER user_email_overrides_touch_updated_at
BEFORE UPDATE ON public.user_email_overrides
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.get_email_template_base(p_slug text)
RETURNS TABLE(subject text, body_html text, from_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.subject, t.body_html, t.from_name
  FROM public.email_templates t
  WHERE t.slug = p_slug
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_email_template_base(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_email_template_base(text) TO authenticated;
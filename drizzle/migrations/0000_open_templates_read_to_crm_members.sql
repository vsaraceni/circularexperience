-- Templates de e-mail do sistema: leitura para todo membro aprovado do CRM,
-- escrita para quem tem a permissão manage_templates (admins incluídos via has_permission).

-- email_template_overrides -------------------------------------------------
CREATE POLICY "CRM members can read email overrides"
ON public.email_template_overrides
FOR SELECT TO authenticated
USING (public.is_crm_member(auth.uid()));

CREATE POLICY "Template managers can insert email overrides"
ON public.email_template_overrides
FOR INSERT TO authenticated
WITH CHECK (public.has_permission(auth.uid(), 'manage_templates'));

CREATE POLICY "Template managers can update email overrides"
ON public.email_template_overrides
FOR UPDATE TO authenticated
USING (public.has_permission(auth.uid(), 'manage_templates'))
WITH CHECK (public.has_permission(auth.uid(), 'manage_templates'));

CREATE POLICY "Template managers can delete email overrides"
ON public.email_template_overrides
FOR DELETE TO authenticated
USING (public.has_permission(auth.uid(), 'manage_templates'));

-- email_templates ------------------------------------------------------------
CREATE POLICY "CRM members can read email templates"
ON public.email_templates
FOR SELECT TO authenticated
USING (public.is_crm_member(auth.uid()));

CREATE POLICY "Template managers manage email templates"
ON public.email_templates
FOR ALL TO authenticated
USING (public.has_permission(auth.uid(), 'manage_templates'))
WITH CHECK (public.has_permission(auth.uid(), 'manage_templates'));
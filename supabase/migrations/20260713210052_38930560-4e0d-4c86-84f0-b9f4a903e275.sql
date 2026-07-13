CREATE OR REPLACE VIEW public.lead_sources_public
WITH (security_invoker=on) AS
SELECT slug, nome, ativo
FROM public.lead_sources
WHERE ativo = true;

GRANT SELECT ON public.lead_sources_public TO authenticated;

-- Permite qualquer usuário autenticado ler apenas linhas ativas via a view (security_invoker respeita RLS da tabela base)
CREATE POLICY "lead_sources_read_active_authenticated"
ON public.lead_sources
FOR SELECT
TO authenticated
USING (ativo = true);
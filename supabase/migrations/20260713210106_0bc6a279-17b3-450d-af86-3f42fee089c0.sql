DROP POLICY IF EXISTS "lead_sources_read_active_authenticated" ON public.lead_sources;

CREATE OR REPLACE VIEW public.lead_sources_public
WITH (security_invoker=off) AS
SELECT slug, nome, ativo
FROM public.lead_sources
WHERE ativo = true;

GRANT SELECT ON public.lead_sources_public TO authenticated;
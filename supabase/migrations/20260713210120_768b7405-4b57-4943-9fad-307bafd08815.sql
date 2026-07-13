DROP VIEW IF EXISTS public.lead_sources_public;

CREATE OR REPLACE FUNCTION public.list_active_lead_sources()
RETURNS TABLE(slug text, nome text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT slug, nome FROM public.lead_sources WHERE ativo = true ORDER BY nome;
$$;

REVOKE ALL ON FUNCTION public.list_active_lead_sources() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_active_lead_sources() TO authenticated;
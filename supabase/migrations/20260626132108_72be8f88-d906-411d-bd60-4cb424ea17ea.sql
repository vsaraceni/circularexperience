-- 1. Trigger BEFORE INSERT/UPDATE em leads para resolver origem+product por campaign_id
CREATE OR REPLACE FUNCTION public.tg_leads_resolve_meta_campaign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mapped_slug text;
  mapped_product uuid;
  source_product uuid;
BEGIN
  IF NEW.campaign_id IS NULL OR btrim(NEW.campaign_id) = '' THEN
    RETURN NEW;
  END IF;

  SELECT ls.slug, m.product_id, ls.product_id
    INTO mapped_slug, mapped_product, source_product
  FROM public.meta_campaign_product_map m
  JOIN public.lead_sources ls ON ls.id = m.lead_source_id AND ls.ativo IS TRUE
  WHERE m.campaign_id = NEW.campaign_id
  LIMIT 1;

  IF mapped_slug IS NULL THEN
    RETURN NEW;
  END IF;

  -- Só sobrescreve se origem atual for vazia ou genérica meta_ads.
  -- Origens específicas explícitas (lp_ce, manual, etc) são preservadas.
  IF NEW.origem IS NULL OR btrim(NEW.origem) = '' OR NEW.origem = 'meta_ads' THEN
    NEW.origem := mapped_slug;
  END IF;

  IF NEW.product_id IS NULL THEN
    NEW.product_id := COALESCE(mapped_product, source_product);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.tg_leads_resolve_meta_campaign() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tg_leads_resolve_meta_campaign ON public.leads;
CREATE TRIGGER tg_leads_resolve_meta_campaign
BEFORE INSERT OR UPDATE OF campaign_id, origem, product_id ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.tg_leads_resolve_meta_campaign();

-- 2. Reaponta mapeamentos Circular Experience da fonte genérica para a específica
UPDATE public.meta_campaign_product_map m
SET lead_source_id = (SELECT id FROM public.lead_sources WHERE slug = 'meta_ads_circular_experience' LIMIT 1)
WHERE m.lead_source_id = (SELECT id FROM public.lead_sources WHERE slug = 'meta_ads' LIMIT 1)
  AND EXISTS (SELECT 1 FROM public.lead_sources WHERE slug = 'meta_ads_circular_experience');

-- 3. Corrige leads históricos com campaign_id mapeado mas origem genérica/sem produto
UPDATE public.leads l
SET origem = ls.slug,
    product_id = COALESCE(l.product_id, m.product_id, ls.product_id)
FROM public.meta_campaign_product_map m
JOIN public.lead_sources ls ON ls.id = m.lead_source_id AND ls.ativo IS TRUE
WHERE l.campaign_id = m.campaign_id
  AND (l.origem = 'meta_ads' OR l.origem IS NULL OR l.product_id IS NULL);

-- 4. Corrige source_slug do log de WhatsApp para refletir a origem atualizada (auditoria)
UPDATE public.whatsapp_send_log w
SET source_slug = l.origem
FROM public.leads l
WHERE w.lead_id = l.id
  AND w.source_slug IS DISTINCT FROM l.origem
  AND l.campaign_id IS NOT NULL;
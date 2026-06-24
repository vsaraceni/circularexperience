GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_campaign_product_map TO authenticated;
GRANT ALL ON public.meta_campaign_product_map TO service_role;

-- Reprocessa leads recentes que caíram em "meta_ads" genérico mas tinham campaign_id mapeado
UPDATE public.leads l
SET origem = ls.slug,
    product_id = COALESCE(m.product_id, ls.product_id)
FROM public.meta_campaign_product_map m
JOIN public.lead_sources ls ON ls.id = m.lead_source_id AND ls.ativo
WHERE l.campaign_id = m.campaign_id
  AND l.origem = 'meta_ads'
  AND l.product_id IS NULL;
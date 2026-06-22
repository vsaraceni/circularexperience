
-- 1. Add product_id to lead_sources
ALTER TABLE public.lead_sources
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

-- 2. Add product_id to leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_leads_product_id ON public.leads(product_id);

-- 3. meta_campaign_product_map table
CREATE TABLE IF NOT EXISTS public.meta_campaign_product_map (
  campaign_id text PRIMARY KEY,
  lead_source_id uuid NOT NULL REFERENCES public.lead_sources(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_campaign_product_map TO authenticated;
GRANT ALL ON public.meta_campaign_product_map TO service_role;

ALTER TABLE public.meta_campaign_product_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage meta campaign map"
  ON public.meta_campaign_product_map
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER meta_campaign_product_map_updated_at
  BEFORE UPDATE ON public.meta_campaign_product_map
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_meta_campaign_map_source ON public.meta_campaign_product_map(lead_source_id);

-- 4. Insert Conexão Circular product if missing
INSERT INTO public.products (slug, name, is_active, sort_order)
SELECT 'conexao-circular', 'Conexão Circular', true,
       COALESCE((SELECT MAX(sort_order) FROM public.products), 0) + 1
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'conexao-circular');

-- 5. Backfill leads.product_id from lead_sources.product_id
UPDATE public.leads l
SET product_id = ls.product_id
FROM public.lead_sources ls
WHERE l.origem = ls.slug
  AND l.product_id IS NULL
  AND ls.product_id IS NOT NULL;

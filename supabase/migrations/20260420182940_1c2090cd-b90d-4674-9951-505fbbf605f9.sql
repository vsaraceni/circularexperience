
-- 1. Tabela products
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  brand_color text DEFAULT '#5F2558',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read products"
  ON public.products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage products"
  ON public.products FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Tabela proposal_master_assets
CREATE TABLE public.proposal_master_assets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  version text NOT NULL,
  label text,
  storage_path text NOT NULL,
  page_count integer,
  is_active boolean NOT NULL DEFAULT false,
  notes text,
  uploaded_by uuid,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX one_active_master_per_product
  ON public.proposal_master_assets(product_id) WHERE is_active;

ALTER TABLE public.proposal_master_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read masters"
  ON public.proposal_master_assets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage masters"
  ON public.proposal_master_assets FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Adicionar colunas em proposals (nullable - aditivo)
ALTER TABLE public.proposals
  ADD COLUMN product_id uuid REFERENCES public.products(id),
  ADD COLUMN master_asset_id uuid REFERENCES public.proposal_master_assets(id);

-- 4. Bucket privado para PDFs mestres
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposal-masters', 'proposal-masters', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins upload masters"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'proposal-masters' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins read masters"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'proposal-masters' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update masters"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'proposal-masters' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete masters"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'proposal-masters' AND has_role(auth.uid(), 'admin'::app_role));

-- 5. Seed: produto Circular Experience
INSERT INTO public.products (slug, name, description, brand_color, sort_order)
VALUES ('circular-experience', 'Circular Experience', 'Workshop de economia circular', '#5F2558', 0)
ON CONFLICT (slug) DO NOTHING;

-- 6. Recriar view vw_proposals_leads incluindo product_id e master_asset_id
DROP VIEW IF EXISTS public.vw_proposals_leads;

CREATE VIEW public.vw_proposals_leads AS
SELECT
  p.id,
  p.slug,
  p.title,
  p.company_name,
  p.contact_name,
  p.contact_role,
  p.event_date,
  p.scope,
  p.investment,
  p.considerations,
  p.valid_until,
  p.status AS proposal_status,
  p.created_at AS proposal_created_at,
  p.author_name,
  p.author_email,
  p.author_phone,
  p.product_id,
  p.master_asset_id,
  prod.slug AS product_slug,
  prod.name AS product_name,
  l.id AS lead_id,
  l.name AS contact_name_lead,
  l.email AS lead_email,
  l.telefone AS lead_telefone,
  l.company AS lead_company,
  l.cargo AS lead_cargo,
  l.kanban_stage,
  l.status AS lead_status,
  l.created_at AS lead_created_at,
  l.assigned_to,
  l.origem,
  l.work_email,
  l.company_website,
  l.company_description,
  l.colaboradores,
  l.briefing_notes,
  l.call_date,
  l.proxima_acao,
  l.valor_proposta,
  l.lost_reason,
  l.lost_notes,
  l.lost_at_stage
FROM public.proposals p
LEFT JOIN public.leads l ON l.id = p.lead_id
LEFT JOIN public.products prod ON prod.id = p.product_id;

-- 7. Trigger updated_at em products
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER products_touch_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

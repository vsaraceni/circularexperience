
-- Fix Security Definer View: recreate with security_invoker
DROP VIEW IF EXISTS public.vw_proposals_leads;

CREATE VIEW public.vw_proposals_leads
WITH (security_invoker = true) AS
SELECT
  p.id, p.slug, p.title, p.company_name, p.contact_name, p.contact_role,
  p.event_date, p.scope, p.investment, p.considerations, p.valid_until,
  p.status AS proposal_status, p.created_at AS proposal_created_at,
  p.author_name, p.author_email, p.author_phone,
  p.product_id, p.master_asset_id,
  prod.slug AS product_slug, prod.name AS product_name,
  l.id AS lead_id, l.name AS contact_name_lead, l.email AS lead_email,
  l.telefone AS lead_telefone, l.company AS lead_company, l.cargo AS lead_cargo,
  l.kanban_stage, l.status AS lead_status, l.created_at AS lead_created_at,
  l.assigned_to, l.origem, l.work_email, l.company_website, l.company_description,
  l.colaboradores, l.briefing_notes, l.call_date, l.proxima_acao, l.valor_proposta,
  l.lost_reason, l.lost_notes, l.lost_at_stage
FROM public.proposals p
LEFT JOIN public.leads l ON l.id = p.lead_id
LEFT JOIN public.products prod ON prod.id = p.product_id;

-- Fix function search_path
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

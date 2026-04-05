
DROP VIEW IF EXISTS public.vw_proposals_leads;

CREATE VIEW public.vw_proposals_leads WITH (security_invoker = true) AS
SELECT
  p.id,
  p.slug,
  p.status AS proposal_status,
  p.company_name,
  p.contact_name,
  p.contact_role,
  p.title,
  p.scope,
  p.investment,
  p.considerations,
  p.event_date,
  p.valid_until,
  p.author_name,
  p.author_email,
  p.author_phone,
  p.created_at AS proposal_created_at,
  p.lead_id,
  l.email AS lead_email,
  l.telefone AS lead_telefone,
  l.cargo AS lead_cargo,
  l.company AS lead_company,
  l.kanban_stage,
  l.lost_at_stage,
  l.lost_reason,
  l.lost_notes,
  l.origem,
  l.colaboradores,
  l.briefing_notes,
  l.work_email,
  l.company_website,
  l.company_description,
  l.assigned_to,
  l.call_date,
  l.created_at AS lead_created_at,
  l.status AS lead_status
FROM public.proposals p
LEFT JOIN public.leads l ON p.lead_id = l.id
WHERE l.email IS NULL
   OR (l.email NOT LIKE '%@atinaedu.com.br' AND l.email NOT LIKE '%@movimentocircular.io');

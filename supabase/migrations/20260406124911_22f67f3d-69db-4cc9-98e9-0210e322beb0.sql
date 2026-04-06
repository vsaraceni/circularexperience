-- Add columns (may already exist from partial migration)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS valor_proposta numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS proxima_acao text DEFAULT NULL;

-- Drop and recreate view to avoid column rename error
DROP VIEW IF EXISTS public.vw_proposals_leads;

CREATE VIEW public.vw_proposals_leads WITH (security_invoker = true) AS
SELECT
  p.id,
  p.slug,
  p.title,
  p.company_name,
  p.contact_name,
  p.contact_role,
  p.event_date,
  regexp_replace(regexp_replace(COALESCE(p.scope, ''), '<[^>]+>', '', 'g'), '&nbsp;', ' ', 'g') AS scope,
  p.investment,
  regexp_replace(regexp_replace(COALESCE(p.considerations, ''), '<[^>]+>', '', 'g'), '&nbsp;', ' ', 'g') AS considerations,
  p.valid_until,
  p.status AS proposal_status,
  p.created_at AS proposal_created_at,
  p.author_name,
  p.author_email,
  p.author_phone,
  p.lead_id,
  l.name AS contact_name_lead,
  l.email AS lead_email,
  l.telefone AS lead_telefone,
  l.cargo AS lead_cargo,
  l.company AS lead_company,
  l.origem,
  l.status AS lead_status,
  l.kanban_stage,
  l.created_at AS lead_created_at,
  l.company_website,
  l.company_description,
  l.colaboradores,
  l.work_email,
  l.call_date,
  l.briefing_notes,
  l.assigned_to,
  l.lost_reason,
  l.lost_notes,
  l.lost_at_stage,
  l.valor_proposta,
  l.proxima_acao
FROM proposals p
LEFT JOIN leads l ON p.lead_id = l.id;
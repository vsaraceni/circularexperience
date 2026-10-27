DROP INDEX IF EXISTS public.unique_lead_proposal;
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON public.proposals(lead_id);
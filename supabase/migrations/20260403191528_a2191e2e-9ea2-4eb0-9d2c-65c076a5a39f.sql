
-- Add column to track which stage a lead was in before being lost
ALTER TABLE public.leads ADD COLUMN lost_at_stage text;

-- Backfill existing lost leads using lead_activities history
UPDATE public.leads SET lost_at_stage = sub.prev_stage
FROM (
  SELECT DISTINCT ON (la.lead_id) la.lead_id,
    COALESCE(
      (SELECT la2.content FROM public.lead_activities la2 
       WHERE la2.lead_id = la.lead_id AND la2.activity_type = 'stage_change' 
       AND la2.created_at < la.created_at 
       ORDER BY la2.created_at DESC LIMIT 1),
      'boas_vindas'
    ) as prev_stage
  FROM public.lead_activities la
  WHERE la.activity_type = 'perdido'
  ORDER BY la.lead_id, la.created_at DESC
) sub
WHERE leads.id = sub.lead_id AND leads.kanban_stage = 'perdido' AND leads.lost_at_stage IS NULL;

-- For any remaining lost leads without activity history, default to boas_vindas
UPDATE public.leads SET lost_at_stage = 'boas_vindas'
WHERE kanban_stage = 'perdido' AND lost_at_stage IS NULL;


-- Function: notify on new lead inserted
CREATE OR REPLACE FUNCTION public.notify_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, lead_id)
  SELECT ur.user_id, 'new_lead',
         'Novo lead: ' || COALESCE(NEW.company, '') || ' — ' || NEW.name,
         COALESCE(NEW.cargo, '') || ' | ' || NEW.email,
         NEW.id
  FROM user_roles ur WHERE ur.role = 'admin';
  RETURN NEW;
END;
$$;

-- Trigger: on new lead
CREATE TRIGGER on_new_lead_inserted
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_lead();

-- Function: notify on stage change to proposta
CREATE OR REPLACE FUNCTION public.notify_stage_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.kanban_stage = 'proposta' AND OLD.kanban_stage IS DISTINCT FROM 'proposta' THEN
    INSERT INTO notifications (user_id, type, title, body, lead_id)
    SELECT ur.user_id, 'stage_proposal',
           'Lead avançou para Proposta: ' || COALESCE(NEW.company, NEW.name),
           'Preparar proposta comercial',
           NEW.id
    FROM user_roles ur WHERE ur.role = 'admin';
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger: on stage change
CREATE TRIGGER on_lead_stage_change
  AFTER UPDATE OF kanban_stage ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_stage_change();

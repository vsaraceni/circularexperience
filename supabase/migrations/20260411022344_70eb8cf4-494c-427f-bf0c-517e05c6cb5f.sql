CREATE OR REPLACE FUNCTION public.notify_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  BEGIN
    INSERT INTO notifications (user_id, type, title, body, lead_id)
    SELECT DISTINCT p.id, 'new_lead',
           'Novo lead: ' || COALESCE(NEW.company, '') || ' — ' || NEW.name,
           COALESCE(NEW.cargo, '') || ' | ' || NEW.email,
           NEW.id
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id
    WHERE ur.role = 'admin'
       OR p.role_label ILIKE 'sdr';
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'notify_new_lead failed: % %', SQLERRM, SQLSTATE;
  END;
  RETURN NEW;
END;
$$;
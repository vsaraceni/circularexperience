
-- Make push notification trigger non-blocking (don't rollback lead insert on push failure)
CREATE OR REPLACE FUNCTION public.trigger_push_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url text;
  service_key text;
BEGIN
  SELECT decrypted_secret INTO supabase_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;
  SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;

  IF supabase_url IS NULL OR service_key IS NULL THEN
    RAISE LOG 'Push notification skipped: missing vault secrets';
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM extensions.http((
      'POST',
      supabase_url || '/functions/v1/send-push-notification',
      ARRAY[
        extensions.http_header('Content-Type', 'application/json'),
        extensions.http_header('Authorization', 'Bearer ' || service_key)
      ],
      'application/json',
      jsonb_build_object(
        'user_id', NEW.user_id,
        'title', NEW.title,
        'body', COALESCE(NEW.body, '')
      )::text
    )::extensions.http_request);
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Push notification failed: % %', SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$function$;

-- Also make notify_new_lead non-blocking for the notification insert
-- (the notification insert triggers push, which can fail)
CREATE OR REPLACE FUNCTION public.notify_new_lead()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  BEGIN
    INSERT INTO notifications (user_id, type, title, body, lead_id)
    SELECT ur.user_id, 'new_lead',
           'Novo lead: ' || COALESCE(NEW.company, '') || ' — ' || NEW.name,
           COALESCE(NEW.cargo, '') || ' | ' || NEW.email,
           NEW.id
    FROM user_roles ur WHERE ur.role = 'admin';
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'notify_new_lead failed: % %', SQLERRM, SQLSTATE;
  END;
  RETURN NEW;
END;
$function$;

-- Also make stage change non-blocking
CREATE OR REPLACE FUNCTION public.notify_stage_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.kanban_stage = 'proposta' AND OLD.kanban_stage IS DISTINCT FROM 'proposta' THEN
    BEGIN
      INSERT INTO notifications (user_id, type, title, body, lead_id)
      SELECT ur.user_id, 'stage_proposal',
             'Lead avançou para Proposta: ' || COALESCE(NEW.company, NEW.name),
             'Preparar proposta comercial',
             NEW.id
      FROM user_roles ur WHERE ur.role = 'admin';
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'notify_stage_change failed: % %', SQLERRM, SQLSTATE;
    END;
  END IF;
  RETURN NEW;
END;
$function$;

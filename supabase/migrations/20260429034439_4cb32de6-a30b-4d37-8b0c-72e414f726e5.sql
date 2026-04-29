
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url text;
  service_key text;
  is_suppressed boolean;
BEGIN
  -- Idempotency / safety filters
  IF NEW.welcome_sent IS TRUE THEN
    RETURN NEW;
  END IF;

  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;

  IF NEW.email ILIKE '%@atinaedu.com.br' OR NEW.email ILIKE '%@movimentocircular.io' THEN
    RETURN NEW;
  END IF;

  IF COALESCE(NEW.kanban_stage, 'novo') <> 'novo' THEN
    RETURN NEW;
  END IF;

  IF COALESCE(NEW.status, 'active') IN ('converted', 'archived') THEN
    RETURN NEW;
  END IF;

  -- Suppression list check
  BEGIN
    SELECT EXISTS(SELECT 1 FROM public.suppressed_emails WHERE lower(email) = lower(NEW.email))
      INTO is_suppressed;
  EXCEPTION WHEN undefined_table THEN
    is_suppressed := false;
  END;
  IF is_suppressed THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO supabase_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;
  SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;

  IF supabase_url IS NULL OR service_key IS NULL THEN
    RAISE LOG 'Welcome email skipped: missing vault secrets';
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM extensions.http((
      'POST',
      supabase_url || '/functions/v1/send-welcome-email',
      ARRAY[
        extensions.http_header('Content-Type', 'application/json'),
        extensions.http_header('Authorization', 'Bearer ' || service_key)
      ],
      'application/json',
      jsonb_build_object(
        'lead_id', NEW.id,
        'name', NEW.name,
        'email', NEW.email,
        'company', COALESCE(NEW.company, ''),
        'cargo', COALESCE(NEW.cargo, '')
      )::text
    )::extensions.http_request);
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Welcome email trigger failed for lead %: % %', NEW.id, SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_lead_insert_welcome ON public.leads;
CREATE TRIGGER on_lead_insert_welcome
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.trigger_welcome_email();

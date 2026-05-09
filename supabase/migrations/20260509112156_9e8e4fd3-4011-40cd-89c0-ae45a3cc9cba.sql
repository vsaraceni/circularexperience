
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_gptmaker()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url text;
  service_key text;
  should_send boolean;
BEGIN
  IF NEW.whatsapp_sent IS TRUE THEN RETURN NEW; END IF;
  IF NEW.telefone IS NULL OR btrim(NEW.telefone) = '' THEN RETURN NEW; END IF;
  IF NEW.email IS NOT NULL AND (
    NEW.email ILIKE '%@atinaedu.com.br' OR NEW.email ILIKE '%@movimentocircular.io'
  ) THEN RETURN NEW; END IF;
  IF COALESCE(NEW.kanban_stage, 'novo') <> 'novo' THEN RETURN NEW; END IF;
  IF COALESCE(NEW.status, 'new') IN ('converted', 'archived') THEN RETURN NEW; END IF;
  IF NEW.origem IS NULL OR btrim(NEW.origem) = '' THEN RETURN NEW; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.lead_sources
    WHERE slug = NEW.origem AND ativo IS TRUE AND whatsapp_auto_send IS TRUE
  ) INTO should_send;
  IF NOT should_send THEN RETURN NEW; END IF;

  SELECT decrypted_secret INTO supabase_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;
  SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;

  IF supabase_url IS NULL OR service_key IS NULL THEN
    RAISE LOG 'WhatsApp auto-send skipped for lead %: missing vault secrets', NEW.id;
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/send-whatsapp-gptmaker',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object('lead_id', NEW.id)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'trigger_whatsapp_gptmaker failed for lead %: % %', NEW.id, SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.trigger_whatsapp_gptmaker() FROM PUBLIC, anon, authenticated;

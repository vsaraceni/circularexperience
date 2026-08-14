CREATE OR REPLACE FUNCTION public.trigger_enrich_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url text;
  service_key text;
BEGIN
  IF COALESCE(NEW.status, 'new') IN ('archived') THEN RETURN NEW; END IF;

  IF NEW.email IS NOT NULL AND (
    NEW.email ILIKE '%@atinaedu.com.br' OR NEW.email ILIKE '%@movimentocircular.io'
  ) THEN RETURN NEW; END IF;

  -- já enriquecido
  IF NEW.company_description IS NOT NULL AND btrim(NEW.company_description) <> ''
     AND NEW.suggested_tier IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO supabase_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;
  SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;

  IF supabase_url IS NULL OR service_key IS NULL THEN
    RAISE LOG 'enrich-lead auto skipped for lead %: missing vault secrets', NEW.id;
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/enrich-lead',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object('lead_id', NEW.id)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'trigger_enrich_lead failed for lead %: % %', NEW.id, SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS tg_leads_enrich_auto ON public.leads;
CREATE TRIGGER tg_leads_enrich_auto
AFTER INSERT ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.trigger_enrich_lead();

REVOKE EXECUTE ON FUNCTION public.trigger_enrich_lead() FROM PUBLIC, anon, authenticated;
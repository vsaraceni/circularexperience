
-- Add welcome_sent column
ALTER TABLE public.leads ADD COLUMN welcome_sent boolean NOT NULL DEFAULT false;

-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create trigger function to auto-send welcome email via pg_net
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  supabase_url text;
  service_key text;
BEGIN
  SELECT decrypted_secret INTO supabase_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;
  SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;

  PERFORM extensions.http_post(
    url := supabase_url || '/functions/v1/send-welcome-email',
    body := jsonb_build_object(
      'lead_id', NEW.id,
      'name', NEW.name,
      'email', NEW.email,
      'company', COALESCE(NEW.company, ''),
      'cargo', COALESCE(NEW.cargo, '')
    )::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    )::jsonb
  );

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_lead_insert
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_email();

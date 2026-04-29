DO $$
DECLARE
  v_key text;
BEGIN
  SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1;
  IF v_key IS NULL THEN
    RAISE EXCEPTION 'email_queue_service_role_key not found in vault';
  END IF;

  IF EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY') THEN
    PERFORM vault.update_secret(
      (SELECT id FROM vault.secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'),
      v_key
    );
  ELSE
    PERFORM vault.create_secret(v_key, 'SUPABASE_SERVICE_ROLE_KEY', 'Service role key for DB triggers calling edge functions');
  END IF;
END $$;

-- Reprocess recent stuck leads
DO $$
DECLARE
  r record;
  supabase_url text;
  service_key text;
BEGIN
  SELECT decrypted_secret INTO supabase_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;
  SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;

  FOR r IN
    SELECT * FROM public.leads
    WHERE welcome_sent = false
      AND kanban_stage = 'novo'
      AND status NOT IN ('converted', 'archived')
      AND email NOT ILIKE '%@atinaedu.com.br'
      AND email NOT ILIKE '%@movimentocircular.io'
      AND created_at >= now() - interval '7 days'
  LOOP
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
          'lead_id', r.id,
          'name', r.name,
          'email', r.email,
          'company', COALESCE(r.company, ''),
          'cargo', COALESCE(r.cargo, '')
        )::text
      )::extensions.http_request);
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Reprocess welcome failed for lead %: % %', r.id, SQLERRM, SQLSTATE;
    END;
  END LOOP;
END $$;
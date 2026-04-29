-- Insert/update vault secrets needed by DB triggers
DO $$
DECLARE
  v_url text := 'https://gxqrmxhpltfkkhhtqvmh.supabase.co';
BEGIN
  -- SUPABASE_URL
  IF EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'SUPABASE_URL') THEN
    PERFORM vault.update_secret(
      (SELECT id FROM vault.secrets WHERE name = 'SUPABASE_URL'),
      v_url
    );
  ELSE
    PERFORM vault.create_secret(v_url, 'SUPABASE_URL', 'Supabase project URL for DB triggers');
  END IF;
END $$;

-- Reprocess recent leads that should have received welcome but didn't
-- (touch updated_at to re-fire trigger via no-op update is not enough since trigger is on INSERT only)
-- Instead: directly re-run the welcome trigger logic for stuck leads by re-inserting via temp table is risky.
-- Safer: change trigger to also fire on UPDATE when welcome_sent flips from true→false (not needed here).
-- For reprocessing, we'll rely on the edge function being invocable manually after this fix.
-- The user can manually click "Enviar Boas-Vindas" from the UI for each stuck lead, OR we can
-- just call the trigger function directly via a one-off statement:
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM public.leads
    WHERE welcome_sent = false
      AND kanban_stage = 'novo'
      AND status NOT IN ('converted', 'archived')
      AND email NOT ILIKE '%@atinaedu.com.br'
      AND email NOT ILIKE '%@movimentocircular.io'
      AND created_at >= now() - interval '7 days'
  LOOP
    -- Simulate trigger by calling it via a synthetic INSERT context isn't possible.
    -- Instead, perform the HTTP call inline using same logic as trigger_welcome_email.
    DECLARE
      supabase_url text;
      service_key text;
    BEGIN
      SELECT decrypted_secret INTO supabase_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;
      SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;
      IF supabase_url IS NOT NULL AND service_key IS NOT NULL THEN
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
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Reprocess welcome failed for lead %: % %', r.id, SQLERRM, SQLSTATE;
    END;
  END LOOP;
END $$;
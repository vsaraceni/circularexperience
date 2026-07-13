
-- 1) Fix profiles broad exposure
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- 2) Fix proposal_master_assets broad read (restrict to admins)
DROP POLICY IF EXISTS "Authenticated read masters" ON public.proposal_master_assets;
CREATE POLICY "Admins read masters" ON public.proposal_master_assets
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) Fix function search_path mutable
CREATE OR REPLACE FUNCTION public.tg_lead_sources_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$function$;

-- 4) Revoke EXECUTE on SECURITY DEFINER functions from PUBLIC/anon/authenticated,
--    then grant back only where the app/RLS actually needs it.

-- Trigger / cron / server-only functions — no client execute
REVOKE ALL ON FUNCTION public.notify_new_lead() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trigger_welcome_email() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trigger_push_notification() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_stage_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trigger_whatsapp_gptmaker() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_leads_resolve_meta_campaign() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_leads_normalize_phone() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_daily_snapshot(date) FROM PUBLIC, anon, authenticated;

-- Functions used by client RPC / RLS — revoke public, grant to needed roles
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.approve_user(uuid, public.app_role, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_user(uuid, public.app_role, text) TO authenticated;

REVOKE ALL ON FUNCTION public.reject_user(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_user(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.list_active_lead_sources() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_active_lead_sources() TO authenticated;

-- get_proposal_by_slug is used publicly to render proposals by slug
REVOKE ALL ON FUNCTION public.get_proposal_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_proposal_by_slug(text) TO anon, authenticated;

-- normalize_phone_e164 is a pure helper; keep available to authenticated
REVOKE ALL ON FUNCTION public.normalize_phone_e164(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.normalize_phone_e164(text) TO authenticated;

-- 1. Tighten realtime.messages topic policy
DROP POLICY IF EXISTS "Authenticated can subscribe to own user topic" ON realtime.messages;

CREATE POLICY "Authenticated can subscribe to own user topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = (auth.uid())::text
  OR realtime.topic() = ('notifications-' || (auth.uid())::text)
  OR realtime.topic() = ('notifications_rt_' || left((auth.uid())::text, 8))
  OR realtime.topic() IN ('strategic-leads', 'strategic-activities')
  OR (realtime.topic() = 'whatsapp-send-log-panel' AND public.is_admin(auth.uid()))
);

-- 2. Revoke anon EXECUTE on internal role-check helpers (not used by anon policies)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
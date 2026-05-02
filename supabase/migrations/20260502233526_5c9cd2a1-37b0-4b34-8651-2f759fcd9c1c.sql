
-- 1. Restrict Realtime channel subscriptions to the owner's user_id topic
-- realtime.messages governs broadcast/presence/postgres_changes subscriptions.
-- For postgres_changes on notifications, the underlying table RLS already
-- filters payloads per row, but we add an explicit topic-scoped policy as
-- defense-in-depth against broadcast/presence channel hijacking.

ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can subscribe to own user topic" ON realtime.messages;
CREATE POLICY "Authenticated can subscribe to own user topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow the user to subscribe to topics that are either their own user_id
  -- or generic table-changes topics (postgres_changes uses table-prefixed
  -- topics that are further filtered by RLS on the underlying table).
  (realtime.topic() = auth.uid()::text)
  OR (realtime.topic() LIKE 'realtime:public:%')
  OR (realtime.topic() LIKE 'strategic-%')
  OR (realtime.topic() LIKE 'whatsapp-%')
  OR (realtime.topic() LIKE 'notifications-%' AND realtime.topic() = 'notifications-' || auth.uid()::text)
);

-- 2. Explicit restrictive policy: block non-admins from writing to user_roles
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
CREATE POLICY "Only admins can update roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

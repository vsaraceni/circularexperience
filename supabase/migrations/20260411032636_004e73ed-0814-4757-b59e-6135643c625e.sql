
-- 1. Fix proposals: restrict anon SELECT to slug-filtered queries only
DROP POLICY IF EXISTS "Public can view proposals by slug" ON public.proposals;
CREATE POLICY "Public can view proposals by slug"
ON public.proposals
FOR SELECT
TO anon
USING (true);
-- Note: Supabase RLS cannot filter by query parameter directly.
-- Instead, we restrict anon to only slug column:
-- Actually the best approach is to keep anon SELECT but limit columns via a view.
-- Simpler: just restrict to anon only (not authenticated) since authenticated already has policies.
-- The real fix: use a function. But simplest safe approach: remove anon access entirely
-- and create an edge function to serve proposals by slug.
-- However, the ProposalView uses supabase client with .eq('slug', slug) which works with anon key.
-- RLS can't restrict to "only when filtering by slug". Let's use a security definer function instead.

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public can view proposals by slug" ON public.proposals;

-- Create a security definer function to fetch proposal by slug
CREATE OR REPLACE FUNCTION public.get_proposal_by_slug(p_slug text)
RETURNS SETOF proposals
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM proposals WHERE slug = p_slug LIMIT 1;
$$;

-- 2. Fix notifications INSERT: remove the overly permissive user insert policy
-- The notify_new_lead trigger uses SECURITY DEFINER so it bypasses RLS
DROP POLICY IF EXISTS "Users insert notifications" ON public.notifications;

-- 3. Fix function search_path on mutable functions
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;

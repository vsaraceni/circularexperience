
-- Migration 2: Proposals table
CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  contact_role text DEFAULT '',
  event_date date,
  title text NOT NULL,
  scope text DEFAULT '',
  investment text DEFAULT '',
  considerations text DEFAULT '',
  valid_until date DEFAULT (CURRENT_DATE + INTERVAL '30 days')::date,
  slug text UNIQUE NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access on proposals"
ON public.proposals FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Public can view by slug (for sharing)
CREATE POLICY "Public can view proposals by slug"
ON public.proposals FOR SELECT
TO anon, authenticated
USING (true);

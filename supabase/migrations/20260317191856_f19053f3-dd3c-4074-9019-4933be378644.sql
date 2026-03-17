
-- Create leads table
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  cargo text DEFAULT '',
  company text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'new'
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert leads"
  ON public.leads FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read leads"
  ON public.leads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update leads"
  ON public.leads FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Add status and lead_id to proposals
ALTER TABLE public.proposals
  ADD COLUMN status text NOT NULL DEFAULT 'enviada',
  ADD COLUMN lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

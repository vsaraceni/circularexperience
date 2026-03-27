CREATE TABLE proposal_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  proposal_id uuid,
  sent_at date NOT NULL DEFAULT CURRENT_DATE,
  channels text[] NOT NULL DEFAULT '{}',
  notes text DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE proposal_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage submissions" ON proposal_submissions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
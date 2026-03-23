
-- Novos campos em leads
ALTER TABLE leads ADD COLUMN kanban_stage text NOT NULL DEFAULT 'novo';
ALTER TABLE leads ADD COLUMN assigned_to uuid REFERENCES profiles(id);
ALTER TABLE leads ADD COLUMN assigned_at timestamptz;
ALTER TABLE leads ADD COLUMN stage_updated_at timestamptz DEFAULT now();
ALTER TABLE leads ADD COLUMN last_activity_at timestamptz;
ALTER TABLE leads ADD COLUMN linkedin_added boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN whatsapp_sent boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN lost_reason text;
ALTER TABLE leads ADD COLUMN lost_notes text;

-- Seed: mapear estágios a partir de dados existentes
UPDATE leads SET kanban_stage = 'boas_vindas' WHERE welcome_sent = true AND status NOT IN ('converted','archived');
UPDATE leads SET kanban_stage = 'proposta' WHERE status = 'converted';
UPDATE leads SET last_activity_at = COALESCE(welcome_sent_at, created_at);

-- Nova tabela lead_activities
CREATE TABLE lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id),
  activity_type text NOT NULL,
  content text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_created_at ON lead_activities(created_at DESC);

-- RLS
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage activities" ON lead_activities FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed atividades para leads existentes
INSERT INTO lead_activities (lead_id, activity_type, content, created_at)
  SELECT id, 'lead_recebido', 'Lead recebido via ' || origem, created_at FROM leads;

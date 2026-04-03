
-- Create campaigns table
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  starts_at date NOT NULL,
  ends_at date NOT NULL,
  goals jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read campaigns" ON public.campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage campaigns" ON public.campaigns FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed example campaign
INSERT INTO public.campaigns (name, starts_at, ends_at, goals) VALUES (
  'Campanha Mês do Meio Ambiente',
  '2026-04-01', '2026-04-30',
  '{"em_contato_pct": 40, "agendamentos_pct": 50, "propostas_pct": 60, "deals_count": 5, "deals_value": 100000}'
);

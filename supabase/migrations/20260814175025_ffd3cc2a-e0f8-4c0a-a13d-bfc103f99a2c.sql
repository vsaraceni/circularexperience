-- ============ helpers ============
CREATE OR REPLACE FUNCTION public.is_crm_member(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _uid
      AND p.approval_status = 'approved'
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_crm_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_crm_member(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.unaccent_safe(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT translate(COALESCE(input, ''),
    'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
    'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC');
$$;

CREATE OR REPLACE FUNCTION public.normalize_org_name(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT NULLIF(
    btrim(regexp_replace(
      regexp_replace(
        lower(public.unaccent_safe(COALESCE(input, ''))),
        '\s+(s\.?\s?a\.?|ltda\.?|me|epp|eireli|s/a|inc\.?|llc)\s*$', '', 'g'
      ),
      '[^a-z0-9 ]', '', 'g'
    )),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.is_generic_email_domain(d text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(COALESCE(d,'')) = ANY (ARRAY[
    'gmail.com','googlemail.com','hotmail.com','hotmail.com.br','outlook.com','outlook.com.br',
    'yahoo.com','yahoo.com.br','live.com','icloud.com','aol.com','protonmail.com','zoho.com',
    'uol.com.br','bol.com.br','terra.com.br','ig.com.br','globo.com','msn.com','me.com'
  ]);
$$;

-- ============ organizations ============
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_normalized text,
  legal_name text,
  cnpj text,
  website text,
  domain text,
  linkedin_url text,
  logo_url text,
  setor text,
  segmento text,
  porte text,
  faixa_funcionarios text,
  faixa_faturamento text,
  cidade text,
  uf text,
  pais text DEFAULT 'BR',
  descricao text,
  tags text[] NOT NULL DEFAULT '{}',
  temas_interesse text[] NOT NULL DEFAULT '{}',
  maturidade_esg smallint,
  tier smallint,
  tier_reasoning text,
  is_multinational boolean NOT NULL DEFAULT false,
  status_relacionamento text NOT NULL DEFAULT 'prospect',
  primeiro_contato_em timestamptz,
  ultima_interacao_em timestamptz,
  owner_id uuid,
  consent_marketing boolean NOT NULL DEFAULT false,
  bloqueado_para_campanhas boolean NOT NULL DEFAULT false,
  enriched_at timestamptz,
  manual_fields text[] NOT NULL DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM members can read organizations"
  ON public.organizations FOR SELECT TO authenticated
  USING (public.is_crm_member(auth.uid()));
CREATE POLICY "CRM members can insert organizations"
  ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (public.is_crm_member(auth.uid()));
CREATE POLICY "CRM members can update organizations"
  ON public.organizations FOR UPDATE TO authenticated
  USING (public.is_crm_member(auth.uid()))
  WITH CHECK (public.is_crm_member(auth.uid()));
CREATE POLICY "Admins can delete organizations"
  ON public.organizations FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE UNIQUE INDEX organizations_cnpj_key ON public.organizations (cnpj) WHERE cnpj IS NOT NULL;
CREATE UNIQUE INDEX organizations_domain_key ON public.organizations (lower(domain)) WHERE domain IS NOT NULL;
CREATE UNIQUE INDEX organizations_name_normalized_key ON public.organizations (name_normalized) WHERE name_normalized IS NOT NULL;
CREATE INDEX organizations_status_idx ON public.organizations (status_relacionamento);
CREATE INDEX organizations_porte_idx ON public.organizations (porte);

CREATE TRIGGER organizations_touch_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ contacts ============
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  nome text NOT NULL,
  email text,
  email_corporativo text,
  telefone text,
  linkedin_url text,
  cargo text,
  nivel_hierarquico text,
  area text,
  decisor boolean NOT NULL DEFAULT false,
  tags text[] NOT NULL DEFAULT '{}',
  idioma text DEFAULT 'pt-BR',
  cidade text,
  uf text,
  origem_primeira text,
  ultimo_contato_em timestamptz,
  emails_enviados integer NOT NULL DEFAULT 0,
  whatsapp_enviados integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ativo',
  consent_marketing boolean NOT NULL DEFAULT false,
  unsubscribed_at timestamptz,
  owner_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM members can read contacts"
  ON public.contacts FOR SELECT TO authenticated
  USING (public.is_crm_member(auth.uid()));
CREATE POLICY "CRM members can insert contacts"
  ON public.contacts FOR INSERT TO authenticated
  WITH CHECK (public.is_crm_member(auth.uid()));
CREATE POLICY "CRM members can update contacts"
  ON public.contacts FOR UPDATE TO authenticated
  USING (public.is_crm_member(auth.uid()))
  WITH CHECK (public.is_crm_member(auth.uid()));
CREATE POLICY "Admins can delete contacts"
  ON public.contacts FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE UNIQUE INDEX contacts_email_key ON public.contacts (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX contacts_organization_idx ON public.contacts (organization_id);
CREATE INDEX contacts_telefone_idx ON public.contacts (telefone);
CREATE INDEX contacts_nome_idx ON public.contacts (lower(nome));

CREATE TRIGGER contacts_touch_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ links ============
ALTER TABLE public.leads
  ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL;
CREATE INDEX leads_organization_idx ON public.leads (organization_id);
CREATE INDEX leads_contact_idx ON public.leads (contact_id);

ALTER TABLE public.proposals
  ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL;
CREATE INDEX proposals_organization_idx ON public.proposals (organization_id);
CREATE INDEX proposals_contact_idx ON public.proposals (contact_id);

-- ============ porte derivation ============
CREATE OR REPLACE FUNCTION public.porte_from_colaboradores(faixa text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN faixa IS NULL OR btrim(faixa) = '' THEN NULL
    WHEN faixa ILIKE '%até_10%' OR faixa ILIKE '%ate_10%' OR faixa ILIKE '1_a_10%' THEN 'micro'
    WHEN faixa ILIKE '%até_100%' OR faixa ILIKE '%ate_100%' OR faixa ILIKE '11_a_100%' THEN 'pequena'
    WHEN faixa ILIKE '101_a_500%' THEN 'media'
    WHEN faixa ILIKE '501_a_2000%' OR faixa ILIKE '501_a_5000%' THEN 'grande'
    WHEN faixa ILIKE '%2000%' OR faixa ILIKE '%5000%' OR faixa ILIKE '%mais_de%' THEN 'enterprise'
    ELSE NULL
  END;
$$;

-- ============ resolver ============
CREATE OR REPLACE FUNCTION public.resolve_org_contact(
  _company text,
  _email text,
  _telefone text,
  _website text,
  _colaboradores text,
  _origem text,
  _descricao text,
  _tier smallint,
  OUT org_id uuid,
  OUT contact_id uuid
)
RETURNS record
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := NULLIF(lower(btrim(COALESCE(_email, ''))), '');
  v_domain text;
  v_name_norm text;
  v_porte text;
BEGIN
  org_id := NULL;
  contact_id := NULL;

  IF v_email IS NOT NULL AND position('@' in v_email) > 0 THEN
    v_domain := split_part(v_email, '@', 2);
    IF public.is_generic_email_domain(v_domain) THEN
      v_domain := NULL;
    END IF;
  END IF;

  v_name_norm := public.normalize_org_name(_company);
  v_porte := public.porte_from_colaboradores(_colaboradores);

  -- organization: domain > normalized name
  IF v_domain IS NOT NULL THEN
    SELECT id INTO org_id FROM public.organizations WHERE lower(domain) = v_domain LIMIT 1;
  END IF;

  IF org_id IS NULL AND v_name_norm IS NOT NULL THEN
    SELECT id INTO org_id FROM public.organizations WHERE name_normalized = v_name_norm LIMIT 1;
  END IF;

  IF org_id IS NULL AND (v_name_norm IS NOT NULL OR v_domain IS NOT NULL) THEN
    INSERT INTO public.organizations (
      name, name_normalized, domain, website, porte, faixa_funcionarios,
      descricao, tier, primeiro_contato_em, ultima_interacao_em
    ) VALUES (
      COALESCE(NULLIF(btrim(_company), ''), v_domain),
      v_name_norm, v_domain, NULLIF(btrim(COALESCE(_website, '')), ''),
      v_porte, NULLIF(btrim(COALESCE(_colaboradores, '')), ''),
      NULLIF(btrim(COALESCE(_descricao, '')), ''), _tier, now(), now()
    )
    RETURNING id INTO org_id;
  ELSIF org_id IS NOT NULL THEN
    UPDATE public.organizations o SET
      ultima_interacao_em = now(),
      domain = COALESCE(o.domain, v_domain),
      website = COALESCE(NULLIF(o.website, ''), NULLIF(btrim(COALESCE(_website, '')), '')),
      porte = COALESCE(o.porte, v_porte),
      faixa_funcionarios = COALESCE(o.faixa_funcionarios, NULLIF(btrim(COALESCE(_colaboradores, '')), '')),
      descricao = COALESCE(NULLIF(o.descricao, ''), NULLIF(btrim(COALESCE(_descricao, '')), '')),
      tier = COALESCE(o.tier, _tier)
    WHERE o.id = org_id;
  END IF;

  -- contact: email > phone
  IF v_email IS NOT NULL THEN
    SELECT id INTO contact_id FROM public.contacts WHERE lower(email) = v_email LIMIT 1;
  END IF;

  IF contact_id IS NULL AND NULLIF(btrim(COALESCE(_telefone, '')), '') IS NOT NULL THEN
    SELECT id INTO contact_id FROM public.contacts WHERE telefone = btrim(_telefone) LIMIT 1;
  END IF;

  RETURN;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.resolve_org_contact(text, text, text, text, text, text, text, smallint) FROM PUBLIC, anon, authenticated;

-- ============ trigger on leads ============
CREATE OR REPLACE FUNCTION public.tg_leads_resolve_org_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  IF NEW.organization_id IS NOT NULL AND NEW.contact_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    SELECT * INTO r FROM public.resolve_org_contact(
      NEW.company, COALESCE(NULLIF(NEW.work_email, ''), NEW.email), NEW.telefone,
      NEW.company_website, NEW.colaboradores, NEW.origem,
      NEW.company_description, NEW.suggested_tier::smallint
    );

    NEW.organization_id := COALESCE(NEW.organization_id, r.org_id);

    IF NEW.contact_id IS NULL THEN
      IF r.contact_id IS NOT NULL THEN
        NEW.contact_id := r.contact_id;
        UPDATE public.contacts SET
          organization_id = COALESCE(organization_id, NEW.organization_id),
          telefone = COALESCE(NULLIF(telefone, ''), NULLIF(btrim(COALESCE(NEW.telefone, '')), '')),
          cargo = COALESCE(NULLIF(cargo, ''), NULLIF(btrim(COALESCE(NEW.cargo, '')), '')),
          email_corporativo = COALESCE(NULLIF(email_corporativo, ''), NULLIF(lower(btrim(COALESCE(NEW.work_email, ''))), '')),
          ultimo_contato_em = now()
        WHERE id = r.contact_id;
      ELSIF NULLIF(btrim(COALESCE(NEW.email, '')), '') IS NOT NULL
         OR NULLIF(btrim(COALESCE(NEW.telefone, '')), '') IS NOT NULL THEN
        INSERT INTO public.contacts (
          organization_id, nome, email, email_corporativo, telefone, cargo,
          origem_primeira, ultimo_contato_em, consent_marketing
        ) VALUES (
          NEW.organization_id,
          COALESCE(NULLIF(btrim(NEW.name), ''), 'Sem nome'),
          NULLIF(lower(btrim(COALESCE(NEW.email, ''))), ''),
          NULLIF(lower(btrim(COALESCE(NEW.work_email, ''))), ''),
          NULLIF(btrim(COALESCE(NEW.telefone, '')), ''),
          NULLIF(btrim(COALESCE(NEW.cargo, '')), ''),
          NEW.origem, now(), COALESCE(NEW.consent_marketing, false)
        )
        ON CONFLICT DO NOTHING
        RETURNING id INTO NEW.contact_id;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'tg_leads_resolve_org_contact failed for lead %: % %', NEW.email, SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_leads_resolve_org_contact
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.tg_leads_resolve_org_contact();

-- ============ backfill ============
-- 1) organizations from existing leads (grouped by normalized company name)
INSERT INTO public.organizations (
  name, name_normalized, website, descricao, porte, faixa_funcionarios,
  tier, is_multinational, primeiro_contato_em, ultima_interacao_em, enriched_at
)
SELECT
  (array_agg(l.company ORDER BY length(COALESCE(l.company, '')) DESC))[1],
  public.normalize_org_name(l.company),
  (array_agg(NULLIF(l.company_website, '') ORDER BY l.created_at DESC NULLS LAST))
    [array_position(array_agg(CASE WHEN NULLIF(l.company_website,'') IS NOT NULL THEN 1 ELSE 0 END ORDER BY l.created_at DESC NULLS LAST), 1)],
  (array_agg(NULLIF(l.company_description, '') ORDER BY length(COALESCE(l.company_description, '')) DESC))[1],
  public.porte_from_colaboradores((array_agg(NULLIF(l.colaboradores,'') ORDER BY l.created_at DESC NULLS LAST))[1]),
  (array_agg(NULLIF(l.colaboradores,'') ORDER BY l.created_at DESC NULLS LAST))[1],
  MIN(l.suggested_tier)::smallint,
  bool_or(COALESCE((l.tier_signals->>'is_multinational')::boolean, false)),
  MIN(l.created_at),
  MAX(COALESCE(l.last_activity_at, l.created_at)),
  CASE WHEN bool_or(NULLIF(l.company_description,'') IS NOT NULL) THEN now() ELSE NULL END
FROM public.leads l
WHERE public.normalize_org_name(l.company) IS NOT NULL
GROUP BY public.normalize_org_name(l.company)
ON CONFLICT DO NOTHING;

-- 2) contacts from existing leads (one per normalized email, newest wins)
INSERT INTO public.contacts (
  organization_id, nome, email, email_corporativo, telefone, cargo,
  origem_primeira, ultimo_contato_em, consent_marketing, created_at
)
SELECT DISTINCT ON (lower(l.email))
  o.id,
  COALESCE(NULLIF(btrim(l.name), ''), 'Sem nome'),
  lower(btrim(l.email)),
  NULLIF(lower(btrim(COALESCE(l.work_email, ''))), ''),
  NULLIF(btrim(COALESCE(l.telefone, '')), ''),
  NULLIF(btrim(COALESCE(l.cargo, '')), ''),
  l.origem,
  COALESCE(l.last_activity_at, l.created_at),
  COALESCE(l.consent_marketing, false),
  COALESCE(l.created_at, now())
FROM public.leads l
LEFT JOIN public.organizations o ON o.name_normalized = public.normalize_org_name(l.company)
WHERE NULLIF(btrim(COALESCE(l.email, '')), '') IS NOT NULL
ORDER BY lower(l.email), l.created_at DESC NULLS LAST
ON CONFLICT DO NOTHING;

-- 3) link leads
UPDATE public.leads l
SET organization_id = o.id
FROM public.organizations o
WHERE l.organization_id IS NULL
  AND o.name_normalized = public.normalize_org_name(l.company);

UPDATE public.leads l
SET contact_id = c.id
FROM public.contacts c
WHERE l.contact_id IS NULL
  AND c.email = lower(btrim(l.email));

-- 4) link proposals (via lead first, then by company name)
UPDATE public.proposals p
SET organization_id = l.organization_id, contact_id = l.contact_id
FROM public.leads l
WHERE p.lead_id = l.id AND p.organization_id IS NULL;

UPDATE public.proposals p
SET organization_id = o.id
FROM public.organizations o
WHERE p.organization_id IS NULL
  AND o.name_normalized = public.normalize_org_name(p.company_name);

-- 5) organization aggregates
UPDATE public.organizations o
SET status_relacionamento = CASE
      WHEN EXISTS (SELECT 1 FROM public.leads l WHERE l.organization_id = o.id AND l.kanban_stage = 'fechado') THEN 'cliente'
      WHEN EXISTS (SELECT 1 FROM public.leads l WHERE l.organization_id = o.id AND l.kanban_stage IN ('proposta','nutricao','tratativas')) THEN 'em_negociacao'
      ELSE 'prospect'
    END;
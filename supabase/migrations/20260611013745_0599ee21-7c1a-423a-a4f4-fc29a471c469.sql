-- Add Tratativas stage support to daily_snapshots and recreate generate_daily_snapshot

ALTER TABLE public.daily_snapshots
  ADD COLUMN IF NOT EXISTS leads_tratativas integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conv_nutricao_tratativas numeric(5,2),
  ADD COLUMN IF NOT EXISTS conv_tratativas_fechado numeric(5,2);

CREATE OR REPLACE FUNCTION public.generate_daily_snapshot(target_date date DEFAULT NULL::date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_date date;
  v_end_of_day timestamptz;
  v_start_of_day timestamptz;
  v_total integer;
  v_novo integer;
  v_bv integer;
  v_contato integer;
  v_call integer;
  v_proposta integer;
  v_nutricao integer;
  v_tratativas integer;
  v_fechado integer;
  v_perdido integer;
  v_pct_contato numeric(5,2);
  v_pct_agend numeric(5,2);
  v_pct_prop numeric(5,2);
  v_pipeline numeric(12,2);
  v_acoes_sdr integer;
  v_leads_novos integer;
  v_conv_novo_bv numeric(5,2);
  v_conv_bv_contato numeric(5,2);
  v_conv_contato_call numeric(5,2);
  v_conv_call_proposta numeric(5,2);
  v_conv_proposta_nutricao numeric(5,2);
  v_conv_nutricao_fechado numeric(5,2);
  v_conv_nutricao_tratativas numeric(5,2);
  v_conv_tratativas_fechado numeric(5,2);
  v_window_start timestamptz;
  v_entered integer;
  v_converted integer;
  v_sdr_ids uuid[];
BEGIN
  v_date := COALESCE(target_date, (now() AT TIME ZONE 'America/Sao_Paulo')::date);
  v_end_of_day := (v_date + interval '1 day')::timestamp AT TIME ZONE 'America/Sao_Paulo';
  v_start_of_day := v_date::timestamp AT TIME ZONE 'America/Sao_Paulo';
  v_window_start := (v_date - interval '14 days')::timestamp AT TIME ZONE 'America/Sao_Paulo';

  IF target_date IS NULL OR target_date = (now() AT TIME ZONE 'America/Sao_Paulo')::date THEN
    SELECT
      COUNT(*) FILTER (WHERE email NOT ILIKE '%@atinaedu.com.br' AND email NOT ILIKE '%@movimentocircular.io'),
      COUNT(*) FILTER (WHERE kanban_stage = 'novo' AND email NOT ILIKE '%@atinaedu.com.br' AND email NOT ILIKE '%@movimentocircular.io'),
      COUNT(*) FILTER (WHERE kanban_stage = 'boas_vindas' AND email NOT ILIKE '%@atinaedu.com.br' AND email NOT ILIKE '%@movimentocircular.io'),
      COUNT(*) FILTER (WHERE kanban_stage = 'em_contato' AND email NOT ILIKE '%@atinaedu.com.br' AND email NOT ILIKE '%@movimentocircular.io'),
      COUNT(*) FILTER (WHERE kanban_stage = 'call_agendada' AND email NOT ILIKE '%@atinaedu.com.br' AND email NOT ILIKE '%@movimentocircular.io'),
      COUNT(*) FILTER (WHERE kanban_stage = 'proposta' AND email NOT ILIKE '%@atinaedu.com.br' AND email NOT ILIKE '%@movimentocircular.io'),
      COUNT(*) FILTER (WHERE kanban_stage = 'nutricao' AND email NOT ILIKE '%@atinaedu.com.br' AND email NOT ILIKE '%@movimentocircular.io'),
      COUNT(*) FILTER (WHERE kanban_stage = 'tratativas' AND email NOT ILIKE '%@atinaedu.com.br' AND email NOT ILIKE '%@movimentocircular.io'),
      COUNT(*) FILTER (WHERE kanban_stage = 'fechado' AND email NOT ILIKE '%@atinaedu.com.br' AND email NOT ILIKE '%@movimentocircular.io'),
      COUNT(*) FILTER (WHERE kanban_stage = 'perdido' AND email NOT ILIKE '%@atinaedu.com.br' AND email NOT ILIKE '%@movimentocircular.io')
    INTO v_total, v_novo, v_bv, v_contato, v_call, v_proposta, v_nutricao, v_tratativas, v_fechado, v_perdido
    FROM leads
    WHERE status != 'archived' AND created_at < v_end_of_day;
  ELSE
    WITH lead_states AS (
      SELECT l.id, l.email, l.created_at,
        COALESCE(
          (SELECT (la.metadata->>'to')::text
           FROM lead_activities la
           WHERE la.lead_id = l.id
             AND la.activity_type = 'stage_mudou'
             AND la.created_at < v_end_of_day
           ORDER BY la.created_at DESC
           LIMIT 1),
          'novo'
        ) AS stage_at_date
      FROM leads l
      WHERE l.status != 'archived'
        AND l.created_at < v_end_of_day
        AND l.email NOT ILIKE '%@atinaedu.com.br'
        AND l.email NOT ILIKE '%@movimentocircular.io'
    )
    SELECT
      COUNT(*),
      COUNT(*) FILTER (WHERE stage_at_date = 'novo'),
      COUNT(*) FILTER (WHERE stage_at_date = 'boas_vindas'),
      COUNT(*) FILTER (WHERE stage_at_date = 'em_contato'),
      COUNT(*) FILTER (WHERE stage_at_date = 'call_agendada'),
      COUNT(*) FILTER (WHERE stage_at_date = 'proposta'),
      COUNT(*) FILTER (WHERE stage_at_date = 'nutricao'),
      COUNT(*) FILTER (WHERE stage_at_date = 'tratativas'),
      COUNT(*) FILTER (WHERE stage_at_date = 'fechado'),
      COUNT(*) FILTER (WHERE stage_at_date = 'perdido')
    INTO v_total, v_novo, v_bv, v_contato, v_call, v_proposta, v_nutricao, v_tratativas, v_fechado, v_perdido
    FROM lead_states;
  END IF;

  IF v_total > 0 THEN
    SELECT
      ROUND(COUNT(*) FILTER (WHERE
        CASE COALESCE(
          CASE WHEN target_date IS NOT NULL AND target_date < (now() AT TIME ZONE 'America/Sao_Paulo')::date THEN
            (SELECT (la2.metadata->>'to')::text FROM lead_activities la2 WHERE la2.lead_id = l2.id AND la2.activity_type = 'stage_mudou' AND la2.created_at < v_end_of_day ORDER BY la2.created_at DESC LIMIT 1)
          ELSE l2.kanban_stage END,
          'novo')
        WHEN 'em_contato' THEN true WHEN 'call_agendada' THEN true WHEN 'proposta' THEN true WHEN 'nutricao' THEN true WHEN 'tratativas' THEN true WHEN 'fechado' THEN true
        WHEN 'perdido' THEN COALESCE(l2.lost_at_stage, 'novo') IN ('em_contato','call_agendada','proposta','nutricao','tratativas','fechado')
        ELSE false END
      )::numeric / v_total * 100, 2),
      ROUND(COUNT(*) FILTER (WHERE
        CASE COALESCE(
          CASE WHEN target_date IS NOT NULL AND target_date < (now() AT TIME ZONE 'America/Sao_Paulo')::date THEN
            (SELECT (la2.metadata->>'to')::text FROM lead_activities la2 WHERE la2.lead_id = l2.id AND la2.activity_type = 'stage_mudou' AND la2.created_at < v_end_of_day ORDER BY la2.created_at DESC LIMIT 1)
          ELSE l2.kanban_stage END,
          'novo')
        WHEN 'call_agendada' THEN true WHEN 'proposta' THEN true WHEN 'nutricao' THEN true WHEN 'tratativas' THEN true WHEN 'fechado' THEN true
        WHEN 'perdido' THEN COALESCE(l2.lost_at_stage, 'novo') IN ('call_agendada','proposta','nutricao','tratativas','fechado')
        ELSE false END
      )::numeric / v_total * 100, 2),
      ROUND(COUNT(*) FILTER (WHERE
        CASE COALESCE(
          CASE WHEN target_date IS NOT NULL AND target_date < (now() AT TIME ZONE 'America/Sao_Paulo')::date THEN
            (SELECT (la2.metadata->>'to')::text FROM lead_activities la2 WHERE la2.lead_id = l2.id AND la2.activity_type = 'stage_mudou' AND la2.created_at < v_end_of_day ORDER BY la2.created_at DESC LIMIT 1)
          ELSE l2.kanban_stage END,
          'novo')
        WHEN 'proposta' THEN true WHEN 'nutricao' THEN true WHEN 'tratativas' THEN true WHEN 'fechado' THEN true
        WHEN 'perdido' THEN COALESCE(l2.lost_at_stage, 'novo') IN ('proposta','nutricao','tratativas','fechado')
        ELSE false END
      )::numeric / v_total * 100, 2)
    INTO v_pct_contato, v_pct_agend, v_pct_prop
    FROM leads l2
    WHERE l2.status != 'archived'
      AND l2.created_at < v_end_of_day
      AND l2.email NOT ILIKE '%@atinaedu.com.br'
      AND l2.email NOT ILIKE '%@movimentocircular.io';
  ELSE
    v_pct_contato := 0; v_pct_agend := 0; v_pct_prop := 0;
  END IF;

  -- Pipeline value: tratativas conta no pipeline (não está em perdido/fechado)
  SELECT COALESCE(SUM(valor_proposta), 0)
  INTO v_pipeline
  FROM leads
  WHERE status != 'archived'
    AND kanban_stage NOT IN ('perdido', 'fechado')
    AND created_at < v_end_of_day
    AND email NOT ILIKE '%@atinaedu.com.br'
    AND email NOT ILIKE '%@movimentocircular.io'
    AND valor_proposta IS NOT NULL;

  SELECT array_agg(p.id) INTO v_sdr_ids
  FROM profiles p WHERE p.role_label ILIKE 'sdr';

  SELECT COUNT(*)
  INTO v_acoes_sdr
  FROM lead_activities la
  WHERE la.created_at >= v_start_of_day
    AND la.created_at < v_end_of_day
    AND la.user_id = ANY(COALESCE(v_sdr_ids, ARRAY[]::uuid[]));

  SELECT COUNT(*)
  INTO v_leads_novos
  FROM leads
  WHERE created_at >= v_start_of_day
    AND created_at < v_end_of_day
    AND email NOT ILIKE '%@atinaedu.com.br'
    AND email NOT ILIKE '%@movimentocircular.io';

  SELECT COUNT(*) INTO v_entered
  FROM leads WHERE created_at >= v_window_start AND created_at < v_end_of_day
    AND email NOT ILIKE '%@atinaedu.com.br' AND email NOT ILIKE '%@movimentocircular.io';
  SELECT COUNT(*) INTO v_converted
  FROM leads l WHERE l.created_at >= v_window_start AND l.created_at < v_end_of_day
    AND l.email NOT ILIKE '%@atinaedu.com.br' AND l.email NOT ILIKE '%@movimentocircular.io'
    AND EXISTS(SELECT 1 FROM lead_activities la WHERE la.lead_id = l.id AND la.activity_type = 'stage_mudou' AND la.metadata->>'to' = 'boas_vindas');
  v_conv_novo_bv := CASE WHEN v_entered > 0 THEN ROUND(v_converted::numeric / v_entered * 100, 2) ELSE NULL END;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE EXISTS(SELECT 1 FROM lead_activities la2 WHERE la2.lead_id = la.lead_id AND la2.activity_type = 'stage_mudou' AND la2.metadata->>'to' = 'em_contato'))
  INTO v_entered, v_converted
  FROM (SELECT DISTINCT lead_id FROM lead_activities la WHERE la.activity_type = 'stage_mudou' AND la.metadata->>'to' = 'boas_vindas' AND la.created_at >= v_window_start AND la.created_at < v_end_of_day) la;
  v_conv_bv_contato := CASE WHEN v_entered > 0 THEN ROUND(v_converted::numeric / v_entered * 100, 2) ELSE NULL END;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE EXISTS(SELECT 1 FROM lead_activities la2 WHERE la2.lead_id = la.lead_id AND la2.activity_type = 'stage_mudou' AND la2.metadata->>'to' = 'call_agendada'))
  INTO v_entered, v_converted
  FROM (SELECT DISTINCT lead_id FROM lead_activities la WHERE la.activity_type = 'stage_mudou' AND la.metadata->>'to' = 'em_contato' AND la.created_at >= v_window_start AND la.created_at < v_end_of_day) la;
  v_conv_contato_call := CASE WHEN v_entered > 0 THEN ROUND(v_converted::numeric / v_entered * 100, 2) ELSE NULL END;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE EXISTS(SELECT 1 FROM lead_activities la2 WHERE la2.lead_id = la.lead_id AND la2.activity_type = 'stage_mudou' AND la2.metadata->>'to' = 'proposta'))
  INTO v_entered, v_converted
  FROM (SELECT DISTINCT lead_id FROM lead_activities la WHERE la.activity_type = 'stage_mudou' AND la.metadata->>'to' = 'call_agendada' AND la.created_at >= v_window_start AND la.created_at < v_end_of_day) la;
  v_conv_call_proposta := CASE WHEN v_entered > 0 THEN ROUND(v_converted::numeric / v_entered * 100, 2) ELSE NULL END;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE EXISTS(SELECT 1 FROM lead_activities la2 WHERE la2.lead_id = la.lead_id AND la2.activity_type = 'stage_mudou' AND la2.metadata->>'to' = 'nutricao'))
  INTO v_entered, v_converted
  FROM (SELECT DISTINCT lead_id FROM lead_activities la WHERE la.activity_type = 'stage_mudou' AND la.metadata->>'to' = 'proposta' AND la.created_at >= v_window_start AND la.created_at < v_end_of_day) la;
  v_conv_proposta_nutricao := CASE WHEN v_entered > 0 THEN ROUND(v_converted::numeric / v_entered * 100, 2) ELSE NULL END;

  -- Nutrição → Tratativas (novo)
  SELECT COUNT(*), COUNT(*) FILTER (WHERE EXISTS(SELECT 1 FROM lead_activities la2 WHERE la2.lead_id = la.lead_id AND la2.activity_type = 'stage_mudou' AND la2.metadata->>'to' = 'tratativas'))
  INTO v_entered, v_converted
  FROM (SELECT DISTINCT lead_id FROM lead_activities la WHERE la.activity_type = 'stage_mudou' AND la.metadata->>'to' = 'nutricao' AND la.created_at >= v_window_start AND la.created_at < v_end_of_day) la;
  v_conv_nutricao_tratativas := CASE WHEN v_entered > 0 THEN ROUND(v_converted::numeric / v_entered * 100, 2) ELSE NULL END;

  -- Tratativas → Fechado (novo)
  SELECT COUNT(*), COUNT(*) FILTER (WHERE EXISTS(SELECT 1 FROM lead_activities la2 WHERE la2.lead_id = la.lead_id AND la2.activity_type = 'stage_mudou' AND la2.metadata->>'to' = 'fechado'))
  INTO v_entered, v_converted
  FROM (SELECT DISTINCT lead_id FROM lead_activities la WHERE la.activity_type = 'stage_mudou' AND la.metadata->>'to' = 'tratativas' AND la.created_at >= v_window_start AND la.created_at < v_end_of_day) la;
  v_conv_tratativas_fechado := CASE WHEN v_entered > 0 THEN ROUND(v_converted::numeric / v_entered * 100, 2) ELSE NULL END;

  -- Mantém Nutrição → Fechado direto (legacy / leads que pulam tratativas)
  SELECT COUNT(*), COUNT(*) FILTER (WHERE EXISTS(SELECT 1 FROM lead_activities la2 WHERE la2.lead_id = la.lead_id AND la2.activity_type = 'stage_mudou' AND la2.metadata->>'to' = 'fechado'))
  INTO v_entered, v_converted
  FROM (SELECT DISTINCT lead_id FROM lead_activities la WHERE la.activity_type = 'stage_mudou' AND la.metadata->>'to' = 'nutricao' AND la.created_at >= v_window_start AND la.created_at < v_end_of_day) la;
  v_conv_nutricao_fechado := CASE WHEN v_entered > 0 THEN ROUND(v_converted::numeric / v_entered * 100, 2) ELSE NULL END;

  INSERT INTO daily_snapshots (
    snapshot_date, total_leads, leads_novo, leads_boas_vindas, leads_em_contato,
    leads_call_agendada, leads_proposta, leads_nutricao, leads_tratativas, leads_fechado, leads_perdido,
    pct_em_contato, pct_agendamentos, pct_propostas, pipeline_value,
    acoes_sdr_dia, leads_novos_dia,
    conv_novo_bv, conv_bv_contato, conv_contato_call, conv_call_proposta,
    conv_proposta_nutricao, conv_nutricao_fechado,
    conv_nutricao_tratativas, conv_tratativas_fechado
  ) VALUES (
    v_date, v_total, v_novo, v_bv, v_contato, v_call, v_proposta, v_nutricao, v_tratativas, v_fechado, v_perdido,
    v_pct_contato, v_pct_agend, v_pct_prop, v_pipeline,
    v_acoes_sdr, v_leads_novos,
    v_conv_novo_bv, v_conv_bv_contato, v_conv_contato_call, v_conv_call_proposta,
    v_conv_proposta_nutricao, v_conv_nutricao_fechado,
    v_conv_nutricao_tratativas, v_conv_tratativas_fechado
  )
  ON CONFLICT (snapshot_date) DO UPDATE SET
    total_leads = EXCLUDED.total_leads,
    leads_novo = EXCLUDED.leads_novo,
    leads_boas_vindas = EXCLUDED.leads_boas_vindas,
    leads_em_contato = EXCLUDED.leads_em_contato,
    leads_call_agendada = EXCLUDED.leads_call_agendada,
    leads_proposta = EXCLUDED.leads_proposta,
    leads_nutricao = EXCLUDED.leads_nutricao,
    leads_tratativas = EXCLUDED.leads_tratativas,
    leads_fechado = EXCLUDED.leads_fechado,
    leads_perdido = EXCLUDED.leads_perdido,
    pct_em_contato = EXCLUDED.pct_em_contato,
    pct_agendamentos = EXCLUDED.pct_agendamentos,
    pct_propostas = EXCLUDED.pct_propostas,
    pipeline_value = EXCLUDED.pipeline_value,
    acoes_sdr_dia = EXCLUDED.acoes_sdr_dia,
    leads_novos_dia = EXCLUDED.leads_novos_dia,
    conv_novo_bv = EXCLUDED.conv_novo_bv,
    conv_bv_contato = EXCLUDED.conv_bv_contato,
    conv_contato_call = EXCLUDED.conv_contato_call,
    conv_call_proposta = EXCLUDED.conv_call_proposta,
    conv_proposta_nutricao = EXCLUDED.conv_proposta_nutricao,
    conv_nutricao_fechado = EXCLUDED.conv_nutricao_fechado,
    conv_nutricao_tratativas = EXCLUDED.conv_nutricao_tratativas,
    conv_tratativas_fechado = EXCLUDED.conv_tratativas_fechado;
END;
$function$;

-- Estende notify_stage_change para notificar entrada em Tratativas também
CREATE OR REPLACE FUNCTION public.notify_stage_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.kanban_stage = 'proposta' AND OLD.kanban_stage IS DISTINCT FROM 'proposta' THEN
    BEGIN
      INSERT INTO notifications (user_id, type, title, body, lead_id)
      SELECT ur.user_id, 'stage_proposal',
             'Lead avançou para Proposta: ' || COALESCE(NEW.company, NEW.name),
             'Preparar proposta comercial',
             NEW.id
      FROM user_roles ur WHERE ur.role = 'admin';
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'notify_stage_change failed (proposta): % %', SQLERRM, SQLSTATE;
    END;
  END IF;

  IF NEW.kanban_stage = 'tratativas' AND OLD.kanban_stage IS DISTINCT FROM 'tratativas' THEN
    BEGIN
      INSERT INTO notifications (user_id, type, title, body, lead_id)
      SELECT ur.user_id, 'stage_tratativas',
             'Lead em Tratativas: ' || COALESCE(NEW.company, NEW.name),
             'Negociação final em andamento',
             NEW.id
      FROM user_roles ur WHERE ur.role = 'admin';
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'notify_stage_change failed (tratativas): % %', SQLERRM, SQLSTATE;
    END;
  END IF;

  RETURN NEW;
END;
$function$;
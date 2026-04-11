import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";

export type PeriodFilter = "7d" | "14d" | "30d" | "all";

export interface DailySnapshot {
  snapshot_date: string;
  total_leads: number;
  leads_novo: number;
  leads_boas_vindas: number;
  leads_em_contato: number;
  leads_call_agendada: number;
  leads_proposta: number;
  leads_nutricao: number;
  leads_fechado: number;
  leads_perdido: number;
  pct_em_contato: number;
  pct_agendamentos: number;
  pct_propostas: number;
  pipeline_value: number;
  acoes_sdr_dia: number;
  leads_novos_dia: number;
  conv_novo_bv: number | null;
  conv_bv_contato: number | null;
  conv_contato_call: number | null;
  conv_call_proposta: number | null;
  conv_proposta_nutricao: number | null;
  conv_nutricao_fechado: number | null;
}

export function useDailySnapshots() {
  const [snapshots, setSnapshots] = useState<DailySnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>("all");

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("daily_snapshots")
        .select("*")
        .order("snapshot_date", { ascending: true });

      if (!error && data) {
        setSnapshots(data as unknown as DailySnapshot[]);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = useMemo(() => {
    if (period === "all") return snapshots;
    const days = period === "7d" ? 7 : period === "14d" ? 14 : 30;
    const cutoff = subDays(new Date(), days).toISOString().slice(0, 10);
    return snapshots.filter((s) => s.snapshot_date >= cutoff);
  }, [snapshots, period]);

  return { snapshots: filtered, allSnapshots: snapshots, loading, period, setPeriod };
}

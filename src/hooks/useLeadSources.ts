import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LeadSourceRow {
  id: string;
  slug: string;
  nome: string;
  api_key_prefix: string;
  ativo: boolean;
  cors_origins: string[];
  rate_limit_per_min: number;
  default_stage: string;
  default_assignee: string | null;
  email_notificar: string[];
  capi_habilitado: boolean;
  capi_action_source: string | null;
  custom_field_schema: Record<string, unknown>;
  notas: string | null;
  created_at: string;
  previous_api_key_prefix: string | null;
  previous_api_key_expires_at: string | null;
  whatsapp_auto_send: boolean;
  whatsapp_channel_id: string | null;
  produto_label: string | null;
  whatsapp_agent_id: string | null;
}

export interface SourceMetrics {
  total_7d: number;
  errors_7d: number;
  last_at: string | null;
}

export function useLeadSources() {
  const [sources, setSources] = useState<LeadSourceRow[]>([]);
  const [metrics, setMetrics] = useState<Record<string, SourceMetrics>>({});
  const [loading, setLoading] = useState(true);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("lead_sources")
      .select(
        "id, slug, nome, api_key_prefix, ativo, cors_origins, rate_limit_per_min, default_stage, default_assignee, email_notificar, capi_habilitado, capi_action_source, custom_field_schema, notas, created_at, previous_api_key_prefix, previous_api_key_expires_at, whatsapp_auto_send, whatsapp_channel_id, produto_label, whatsapp_agent_id",
      )
      .order("created_at", { ascending: false });

    if (!error && data) setSources(data as LeadSourceRow[]);
    setLoading(false);
  }, []);

  const fetchMetrics = useCallback(async () => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("lead_ingest_log")
      .select("source_slug, status, created_at")
      .gte("created_at", since)
      .limit(5000);

    if (!data) return;
    const map: Record<string, SourceMetrics> = {};
    for (const row of data as Array<{ source_slug: string | null; status: string; created_at: string }>) {
      if (!row.source_slug) continue;
      const m = map[row.source_slug] ?? { total_7d: 0, errors_7d: 0, last_at: null };
      m.total_7d += 1;
      if (row.status !== "created" && row.status !== "duplicate") m.errors_7d += 1;
      if (!m.last_at || row.created_at > m.last_at) m.last_at = row.created_at;
      map[row.source_slug] = m;
    }
    setMetrics(map);
  }, []);

  useEffect(() => {
    fetchSources();
    fetchMetrics();
  }, [fetchSources, fetchMetrics]);

  return { sources, metrics, loading, refresh: fetchSources, refreshMetrics: fetchMetrics };
}
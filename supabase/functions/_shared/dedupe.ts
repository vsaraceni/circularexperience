// Estratégia de deduplicação de lead.
// Forte: (origem, source_id) — quando a origem manda um ID externo único.
// Brando: (origem, lower(email)) em janela de 24h — evita duplo-submit do mesmo form.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";

const SOFT_WINDOW_HOURS = 24;

export async function findDuplicate(
  supabase: SupabaseClient,
  params: { origem: string; sourceId: string | null; email: string },
): Promise<string | null> {
  const { origem, sourceId, email } = params;

  if (sourceId) {
    const { data, error } = await supabase
      .from("leads")
      .select("id")
      .eq("origem", origem)
      .eq("source_id", sourceId)
      .maybeSingle();
    if (error && error.code !== "PGRST116") {
      console.error("dedupe strong failed:", error.message);
    }
    if (data) return data.id;
  }

  const sinceIso = new Date(
    Date.now() - SOFT_WINDOW_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("leads")
    .select("id")
    .eq("origem", origem)
    .ilike("email", email)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("dedupe soft failed:", error.message);
    return null;
  }
  return data?.id ?? null;
}
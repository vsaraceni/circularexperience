// Rate limit por origem (lead_sources.rate_limit_per_min).
// Usa lead_ingest_log como contador — barato pra MVP.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";

export async function checkRateLimit(
  supabase: SupabaseClient,
  sourceSlug: string,
  limitPerMin: number,
): Promise<{ allowed: boolean; current: number }> {
  if (limitPerMin <= 0) return { allowed: true, current: 0 };

  const sinceIso = new Date(Date.now() - 60_000).toISOString();
  const { count, error } = await supabase
    .from("lead_ingest_log")
    .select("id", { head: true, count: "exact" })
    .eq("source_slug", sourceSlug)
    .gte("created_at", sinceIso);

  if (error) {
    // Fail open: não bloqueia leads se a query falhar.
    console.error("rate_limit check failed:", error.message);
    return { allowed: true, current: 0 };
  }

  const current = count ?? 0;
  return { allowed: current < limitPerMin, current };
}
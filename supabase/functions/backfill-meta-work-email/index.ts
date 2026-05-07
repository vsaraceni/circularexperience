import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";
import { isGenericEmail, pickMetaLeadEmails } from "../_shared/meta-lead-fields.ts";

/**
 * backfill-meta-work-email
 *
 * Refaz o fetch na Graph API da Meta para leads que têm fb_lead_id mas não
 * possuem email profissional capturado (work_email vazio ou igual ao email).
 *
 * Aplica o mesmo mapeamento de campos do webhook atual:
 *   - email profissional vira o principal do CRM
 *   - email pessoal antigo vai para custom_fields.personal_email (backup)
 *
 * Chamada: POST /functions/v1/backfill-meta-work-email  (body opcional: {"limit": 200})
 * Apenas admin (verifica header Authorization contra service role).
 */

const GRAPH_BASE = "https://graph.facebook.com/v18.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchLeadData(leadgenId: string, accessToken: string) {
  const fields = "id,created_time,field_data,ad_id,adset_id,campaign_id,form_id";
  const url = `${GRAPH_BASE}/${leadgenId}?fields=${fields}&access_token=${accessToken}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) {
    return { ok: false as const, status: res.status, error: text };
  }
  try {
    return { ok: true as const, data: JSON.parse(text) };
  } catch {
    return { ok: false as const, status: res.status, error: "invalid json" };
  }
}

async function fetchAdCreativeFormId(adId: string, accessToken: string): Promise<string | null> {
  const fields = [
    "creative{object_story_spec,asset_feed_spec,effective_object_story_id}",
  ].join(",");
  const url = `${GRAPH_BASE}/${adId}?fields=${encodeURIComponent(fields)}&access_token=${accessToken}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) {
    console.warn("Could not fetch ad creative for form recovery", adId, res.status, text.slice(0, 240));
    return null;
  }
  const data = JSON.parse(text);
  return findLeadGenFormId(data);
}

function findLeadGenFormId(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  if (Array.isArray(input)) {
    for (const item of input) {
      const found = findLeadGenFormId(item);
      if (found) return found;
    }
    return null;
  }
  const obj = input as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj)) {
    if (key === "lead_gen_form_id" && (typeof value === "string" || typeof value === "number")) {
      return String(value);
    }
    const found = findLeadGenFormId(value);
    if (found) return found;
  }
  return null;
}

async function fetchLeadDataFromForm(formId: string, leadgenId: string, accessToken: string) {
  let after = "";
  for (let page = 0; page < 12; page++) {
    const params = new URLSearchParams({
      fields: "created_time,id,ad_id,adset_id,campaign_id,form_id,field_data",
      limit: "100",
      access_token: accessToken,
    });
    if (after) params.set("after", after);
    const res = await fetch(`${GRAPH_BASE}/${formId}/leads?${params.toString()}`);
    const text = await res.text();
    if (!res.ok) {
      return { ok: false as const, status: res.status, error: text };
    }
    const data = JSON.parse(text);
    const lead = (data.data ?? []).find((item: any) => String(item.id) === String(leadgenId));
    if (lead) return { ok: true as const, data: lead };
    after = data.paging?.cursors?.after ?? "";
    if (!data.paging?.next || !after) break;
  }
  return { ok: false as const, status: 404, error: `lead ${leadgenId} not found in form ${formId}` };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const accessToken = Deno.env.get("META_ACCESS_TOKEN");

  if (!accessToken) {
    return new Response(JSON.stringify({ error: "META_ACCESS_TOKEN not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Auth: aceita service-role direto OU usuário autenticado com role 'admin'
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  let allowed = token === serviceKey;
  if (!allowed && token) {
    try {
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || serviceKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: u } = await userClient.auth.getUser();
      if (u?.user?.id) {
        const adminClient = createClient(supabaseUrl, serviceKey);
        const { data: roles } = await adminClient.from("user_roles").select("role").eq("user_id", u.user.id);
        allowed = (roles ?? []).some((r: any) => r.role === "admin");
      }
    } catch { /* ignore */ }
  }
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let limit = 200;
  try {
    const body = await req.json().catch(() => ({}));
    if (body && typeof body.limit === "number") limit = Math.min(500, Math.max(1, body.limit));
  } catch { /* ignore */ }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: candidates, error: qErr } = await supabase
    .from("leads")
    .select("id, email, work_email, custom_fields, fb_lead_id, ad_id, source_metadata")
    .ilike("origem", "%meta%")
    .not("fb_lead_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (qErr) {
    return new Response(JSON.stringify({ error: qErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Filtra: work_email vazio OU igual ao email atual
  const targets = (candidates ?? []).filter((l: any) => {
    const we = (l.work_email || "").trim().toLowerCase();
    const em = (l.email || "").trim().toLowerCase();
    return !we || (we === em && isGenericEmail(em));
  });

  const summary = {
    scanned: candidates?.length ?? 0,
    targets: targets.length,
    updated: 0,
    no_work_email: 0,
    stale_or_error: 0,
    recovered_via_form: 0,
    errors: [] as Array<{ id: string; fb_lead_id: string; error: string }>,
  };

  for (const lead of targets) {
    try {
      let r = await fetchLeadData(lead.fb_lead_id as string, accessToken);
      if (!r.ok && lead.ad_id) {
        const formId = await fetchAdCreativeFormId(String(lead.ad_id), accessToken);
        if (formId) {
          const fromForm = await fetchLeadDataFromForm(formId, String(lead.fb_lead_id), accessToken);
          if (fromForm.ok) {
            r = fromForm;
            summary.recovered_via_form++;
          }
        }
      }
      if (!r.ok) {
        summary.stale_or_error++;
        summary.errors.push({ id: lead.id, fb_lead_id: lead.fb_lead_id, error: r.error.slice(0, 200) });
        continue;
      }
      const { workEmailRaw, personalEmail, rawKeys } = pickMetaLeadEmails(r.data.field_data ?? []);
      console.log("Backfill Meta field keys:", rawKeys);
      if (!workEmailRaw) {
        summary.no_work_email++;
        continue;
      }
      const newPrimary = workEmailRaw;
      const personalBackup =
        (personalEmail || lead.email || "").trim() &&
        (personalEmail || lead.email).toLowerCase() !== newPrimary.toLowerCase()
          ? personalEmail || lead.email
          : null;

      const newCustom = { ...(lead.custom_fields || {}) };
      if (personalBackup) newCustom.personal_email = personalBackup;

      const { error: upErr } = await supabase
        .from("leads")
        .update({
          email: newPrimary,
          work_email: newPrimary,
          custom_fields: newCustom,
        })
        .eq("id", lead.id);

      if (upErr) {
        summary.errors.push({ id: lead.id, fb_lead_id: lead.fb_lead_id, error: upErr.message });
      } else {
        summary.updated++;
      }
    } catch (e) {
      summary.errors.push({ id: lead.id, fb_lead_id: lead.fb_lead_id, error: String(e).slice(0, 200) });
    }
    // pequena pausa para não estourar rate-limit da Graph API
    await new Promise((r) => setTimeout(r, 120));
  }

  console.log("backfill-meta-work-email summary:", JSON.stringify(summary));
  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
// supabase/functions/ingest-lead/index.ts
//
// Endpoint público pra ingestão de leads de qualquer formulário externo.
// Autenticado por API key cadastrada em `lead_sources` (bcrypt).
//
// POST https://<proj>.supabase.co/functions/v1/ingest-lead
// Header: x-mc-api-key: <chave da source>
// Body:   ver _shared/ingest-types.ts (ingestPayloadSchema)
//
// Retorna { ok, status, lead_id?, error? }.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";
import {
  ingestPayloadSchema,
  type LeadSource,
  type IngestStatus,
} from "../_shared/ingest-types.ts";
import {
  authenticateApiKey,
  AuthError,
  checkCors,
} from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { findDuplicate } from "../_shared/dedupe.ts";
import {
  normalizeEmail,
  normalizePhone,
  pickClientIp,
  pickUserAgent,
  payloadHash,
} from "../_shared/normalize.ts";

declare const EdgeRuntime: { waitUntil: (p: Promise<unknown>) => void };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-mc-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function writeLog(
  supabase: ReturnType<typeof createClient>,
  fields: {
    sourceSlug: string | null;
    ip: string | null;
    status: IngestStatus;
    leadId?: string;
    error?: string;
    payloadDigest?: string;
    durationMs: number;
  },
) {
  try {
    await supabase.from("lead_ingest_log").insert({
      source_slug: fields.sourceSlug,
      ip: fields.ip,
      status: fields.status,
      lead_id: fields.leadId ?? null,
      error: fields.error ?? null,
      payload_hash: fields.payloadDigest ?? null,
      duration_ms: fields.durationMs,
    });
  } catch (err) {
    console.error("writeLog failed:", err);
  }
}

Deno.serve(async (req) => {
  const t0 = Date.now();

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { ok: false, status: "invalid", error: "method not allowed" },
      405,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const ip = pickClientIp(req);
  const ua = pickUserAgent(req);
  const apiKey = req.headers.get("x-mc-api-key");

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    await writeLog(supabase, {
      sourceSlug: null,
      ip,
      status: "invalid",
      error: "could not read body",
      durationMs: Date.now() - t0,
    });
    return jsonResponse(
      { ok: false, status: "invalid", error: "could not read body" },
      400,
    );
  }

  const digest = await payloadHash(rawBody);

  // 1. Auth
  let source: LeadSource;
  try {
    source = await authenticateApiKey(supabase, apiKey);
  } catch (err) {
    const e = err as AuthError;
    await writeLog(supabase, {
      sourceSlug: null,
      ip,
      status: e.httpStatus === 403 ? "forbidden" : "invalid",
      error: e.message,
      payloadDigest: digest,
      durationMs: Date.now() - t0,
    });
    return jsonResponse(
      { ok: false, status: "invalid", error: e.message },
      e.httpStatus,
    );
  }

  // 2. CORS
  try {
    checkCors(req, source);
  } catch (err) {
    const e = err as AuthError;
    await writeLog(supabase, {
      sourceSlug: source.slug,
      ip,
      status: "forbidden",
      error: e.message,
      payloadDigest: digest,
      durationMs: Date.now() - t0,
    });
    return jsonResponse(
      { ok: false, status: "forbidden", error: e.message },
      403,
    );
  }

  // 3. Rate limit
  const rl = await checkRateLimit(supabase, source.slug, source.rate_limit_per_min);
  if (!rl.allowed) {
    await writeLog(supabase, {
      sourceSlug: source.slug,
      ip,
      status: "rate_limited",
      error: `rate limit ${source.rate_limit_per_min}/min reached (current=${rl.current})`,
      payloadDigest: digest,
      durationMs: Date.now() - t0,
    });
    return jsonResponse(
      { ok: false, status: "rate_limited", error: "rate limit reached" },
      429,
    );
  }

  // 4. Parse + validação
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    await writeLog(supabase, {
      sourceSlug: source.slug,
      ip,
      status: "invalid",
      error: "invalid JSON",
      payloadDigest: digest,
      durationMs: Date.now() - t0,
    });
    return jsonResponse(
      { ok: false, status: "invalid", error: "invalid JSON" },
      400,
    );
  }

  const validation = ingestPayloadSchema.safeParse(parsed);
  if (!validation.success) {
    const issues = validation.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    await writeLog(supabase, {
      sourceSlug: source.slug,
      ip,
      status: "invalid",
      error: `validation failed: ${issues}`,
      payloadDigest: digest,
      durationMs: Date.now() - t0,
    });
    return jsonResponse(
      { ok: false, status: "invalid", error: `validation failed: ${issues}` },
      400,
    );
  }

  const payload = validation.data;

  // Source mismatch — chave da source A não pode declarar source B
  if (payload.source !== source.slug) {
    await writeLog(supabase, {
      sourceSlug: source.slug,
      ip,
      status: "forbidden",
      error: `source mismatch: key for ${source.slug}, payload claims ${payload.source}`,
      payloadDigest: digest,
      durationMs: Date.now() - t0,
    });
    return jsonResponse(
      { ok: false, status: "forbidden", error: "source mismatch" },
      403,
    );
  }

  // 5. Normalize
  const email = normalizeEmail(payload.email);
  const telefone = normalizePhone(payload.telefone);
  const sourceId = payload.source_id ?? null;

  // 6. Dedupe
  const existingId = await findDuplicate(supabase, {
    origem: source.slug,
    sourceId,
    email,
  });
  if (existingId) {
    await writeLog(supabase, {
      sourceSlug: source.slug,
      ip,
      status: "duplicate",
      leadId: existingId,
      payloadDigest: digest,
      durationMs: Date.now() - t0,
    });
    return jsonResponse(
      { ok: true, status: "duplicate", lead_id: existingId },
      200,
    );
  }

  // 7. Insert
  const now = new Date().toISOString();
  const insertRow = {
    name: payload.name,
    email,
    telefone: telefone ?? "",
    company: payload.company ?? "",
    cargo: payload.cargo ?? "",
    origem: source.slug,
    source_id: sourceId,
    source_metadata: { source_name: source.nome },
    utm_source: payload.utm?.source ?? null,
    utm_medium: payload.utm?.medium ?? null,
    utm_campaign: payload.utm?.campaign ?? null,
    utm_content: payload.utm?.content ?? null,
    utm_term: payload.utm?.term ?? null,
    custom_fields: payload.custom_fields ?? {},
    consent_marketing: payload.consent_marketing ?? false,
    ingest_ip: ip,
    ingest_user_agent: ua,
    kanban_stage: source.default_stage,
    assigned_to: source.default_assignee,
    assigned_at: source.default_assignee ? now : null,
    last_activity_at: now,
    stage_updated_at: now,
  };

  const { data: inserted, error: insertErr } = await supabase
    .from("leads")
    .insert(insertRow)
    .select("id")
    .single();

  if (insertErr || !inserted) {
    const msg = insertErr?.message ?? "insert returned no row";
    await writeLog(supabase, {
      sourceSlug: source.slug,
      ip,
      status: "error",
      error: msg,
      payloadDigest: digest,
      durationMs: Date.now() - t0,
    });
    return jsonResponse({ ok: false, status: "error", error: msg }, 500);
  }

  const leadId = inserted.id as string;

  // 8. Activity
  try {
    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      activity_type: "lead_recebido",
      content: `Lead recebido via ${source.nome}${payload.company ? ` — ${payload.company}` : ""}`,
      metadata: {
        source_slug: source.slug,
        source_id: sourceId,
        utm: payload.utm ?? null,
      },
    });
  } catch (err) {
    console.error("lead_activities insert failed:", err);
  }

  // 9. CAPI condicional (não bloqueia resposta)
  const shouldCapi = payload.trigger_capi ?? source.capi_habilitado;
  if (shouldCapi) {
    EdgeRuntime.waitUntil(
      supabase.functions
        .invoke("send-meta-capi-event", {
          body: {
            lead_id: leadId,
            email,
            telefone,
            fb_lead_id: source.slug === "meta_ads" ? sourceId : undefined,
            stage: "novo",
          },
        })
        .catch((err) => console.error("CAPI invoke failed:", err)),
    );
  }

  // 10. Email interno condicional (não bloqueia resposta)
  if (source.email_notificar && source.email_notificar.length > 0) {
    const templateData = {
      lead_name: payload.name,
      lead_email: email,
      lead_company: payload.company ?? "",
      lead_cargo: payload.cargo ?? "",
      lead_telefone: telefone ?? "",
      source_nome: source.nome,
      custom_fields: payload.custom_fields ?? {},
      lead_id: leadId,
    };
    for (const recipient of source.email_notificar) {
      EdgeRuntime.waitUntil(
        supabase.functions
          .invoke("send-transactional-email", {
            body: {
              templateName: "novo-lead-interno",
              recipientEmail: recipient,
              templateData,
            },
          })
          .catch((err) => console.error("notify-email invoke failed:", err)),
      );
    }
  }

  // 10b. WhatsApp via GPT Maker (não bloqueia resposta)
  if (source.whatsapp_auto_send) {
    EdgeRuntime.waitUntil(
      supabase.functions
        .invoke("send-whatsapp-gptmaker", {
          body: { lead_id: leadId },
        })
        .catch((err) =>
          console.error("send-whatsapp-gptmaker invoke failed:", err),
        ),
    );
  }

  // 10c. Enriquecimento automático: agora feito pelo trigger tg_leads_enrich_auto

  // 11. Log final
  await writeLog(supabase, {
    sourceSlug: source.slug,
    ip,
    status: "created",
    leadId,
    payloadDigest: digest,
    durationMs: Date.now() - t0,
  });

  return jsonResponse(
    { ok: true, status: "created", lead_id: leadId },
    201,
  );
});
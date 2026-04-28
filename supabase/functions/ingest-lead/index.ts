// Edge Function: ingest-lead
// Endpoint público para ingestão de leads vindos de formulários externos.
//
// Auth: header `x-api-key: <prefix>.<secret>` validado contra `lead_sources`
// CORS: dinâmico via `lead_sources.cors_origins` (ou `*` quando vazio)
// Rate limit: por source/IP/minuto, usando `lead_ingest_log`
// Dedupe: por (source_slug + email) nas últimas 24h → status "duplicate"
// CAPI: dispara `send-meta-capi-event` quando `capi_habilitado` e `trigger_capi=true`

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";
import {
  ingestPayloadSchema,
  parseApiKey,
  sha256Hex,
  type IngestPayload,
  type IngestResult,
  type IngestStatus,
  type LeadSource,
} from "./schema.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BASE_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

function corsHeadersFor(origin: string | null, allowed: string[]): Record<string, string> {
  const headers = { ...BASE_CORS_HEADERS } as Record<string, string>;
  if (!allowed || allowed.length === 0) {
    headers["Access-Control-Allow-Origin"] = "*";
  } else if (origin && allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  } else {
    // Origem não permitida — devolvemos sem header de Allow-Origin (browser bloqueia).
  }
  return headers;
}

function jsonResponse(
  body: IngestResult,
  status: number,
  cors: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function getClientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

async function logIngest(
  admin: ReturnType<typeof createClient>,
  data: {
    source_slug: string | null;
    status: IngestStatus;
    lead_id?: string | null;
    ip?: string | null;
    payload_hash?: string | null;
    error?: string | null;
    duration_ms: number;
  },
) {
  try {
    await admin.from("lead_ingest_log").insert({
      source_slug: data.source_slug,
      status: data.status,
      lead_id: data.lead_id ?? null,
      ip: data.ip ?? null,
      payload_hash: data.payload_hash ?? null,
      error: data.error ?? null,
      duration_ms: data.duration_ms,
    });
  } catch (err) {
    console.error("logIngest failed:", err);
  }
}

Deno.serve(async (req: Request) => {
  const startedAt = Date.now();
  const origin = req.headers.get("origin");
  const ip = getClientIp(req);

  // Default CORS (sem source ainda) — substituído após carregar source.
  let cors = corsHeadersFor(origin, []);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { ok: false, status: "invalid", error: "Method not allowed" },
      405,
      cors,
    );
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // 1) Auth via API key
  const parsed = parseApiKey(req.headers.get("x-api-key"));
  if (!parsed) {
    await logIngest(admin, {
      source_slug: null,
      status: "forbidden",
      ip,
      error: "missing_api_key",
      duration_ms: Date.now() - startedAt,
    });
    return jsonResponse(
      { ok: false, status: "forbidden", error: "Missing or malformed x-api-key" },
      401,
      cors,
    );
  }

  const { data: source, error: sourceErr } = await admin
    .from("lead_sources")
    .select(
      "id, slug, nome, api_key_prefix, api_key_hash, ativo, capi_habilitado, capi_action_source, email_notificar, default_stage, default_assignee, cors_origins, rate_limit_per_min, custom_field_schema",
    )
    .eq("api_key_prefix", parsed.prefix)
    .maybeSingle();

  if (sourceErr || !source) {
    await logIngest(admin, {
      source_slug: null,
      status: "forbidden",
      ip,
      error: "unknown_prefix",
      duration_ms: Date.now() - startedAt,
    });
    return jsonResponse(
      { ok: false, status: "forbidden", error: "Invalid API key" },
      401,
      cors,
    );
  }

  const leadSource = source as LeadSource;
  cors = corsHeadersFor(origin, leadSource.cors_origins ?? []);

  if (!leadSource.ativo) {
    await logIngest(admin, {
      source_slug: leadSource.slug,
      status: "forbidden",
      ip,
      error: "source_inactive",
      duration_ms: Date.now() - startedAt,
    });
    return jsonResponse(
      { ok: false, status: "forbidden", error: "Source is inactive" },
      403,
      cors,
    );
  }

  const providedHash = await sha256Hex(parsed.secret);
  if (providedHash !== leadSource.api_key_hash) {
    await logIngest(admin, {
      source_slug: leadSource.slug,
      status: "forbidden",
      ip,
      error: "bad_secret",
      duration_ms: Date.now() - startedAt,
    });
    return jsonResponse(
      { ok: false, status: "forbidden", error: "Invalid API key" },
      401,
      cors,
    );
  }

  // 2) Rate limit (por source + IP, na última janela de 60s)
  if (leadSource.rate_limit_per_min > 0) {
    const windowStart = new Date(Date.now() - 60_000).toISOString();
    const filter = admin
      .from("lead_ingest_log")
      .select("id", { count: "exact", head: true })
      .eq("source_slug", leadSource.slug)
      .gte("created_at", windowStart);

    if (ip) filter.eq("ip", ip);
    const { count } = await filter;

    if ((count ?? 0) >= leadSource.rate_limit_per_min) {
      await logIngest(admin, {
        source_slug: leadSource.slug,
        status: "rate_limited",
        ip,
        duration_ms: Date.now() - startedAt,
      });
      return jsonResponse(
        { ok: false, status: "rate_limited", error: "Too many requests" },
        429,
        cors,
      );
    }
  }

  // 3) Parse + validação do body
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    await logIngest(admin, {
      source_slug: leadSource.slug,
      status: "invalid",
      ip,
      error: "invalid_json",
      duration_ms: Date.now() - startedAt,
    });
    return jsonResponse(
      { ok: false, status: "invalid", error: "Invalid JSON body" },
      400,
      cors,
    );
  }

  // Aceita payload sem o campo `source` explícito — usamos o slug do lead_sources.
  if (rawBody && typeof rawBody === "object" && !("source" in rawBody)) {
    (rawBody as Record<string, unknown>).source = leadSource.slug;
  }

  const validation = ingestPayloadSchema.safeParse(rawBody);
  if (!validation.success) {
    const flat = validation.error.flatten();
    await logIngest(admin, {
      source_slug: leadSource.slug,
      status: "invalid",
      ip,
      error: JSON.stringify(flat.fieldErrors).slice(0, 500),
      duration_ms: Date.now() - startedAt,
    });
    return jsonResponse(
      { ok: false, status: "invalid", error: "Validation failed" },
      400,
      cors,
    );
  }

  const payload: IngestPayload = validation.data;
  const payloadHash = await sha256Hex(
    `${leadSource.slug}|${payload.email.toLowerCase()}|${payload.source_id ?? ""}`,
  );

  // 4) Dedupe — mesmo email vindo da mesma source nas últimas 24h
  const dedupeWindowStart = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const { data: existing } = await admin
    .from("leads")
    .select("id")
    .eq("email", payload.email.toLowerCase())
    .eq("origem", leadSource.slug)
    .gte("created_at", dedupeWindowStart)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await logIngest(admin, {
      source_slug: leadSource.slug,
      status: "duplicate",
      lead_id: existing.id,
      ip,
      payload_hash: payloadHash,
      duration_ms: Date.now() - startedAt,
    });
    return jsonResponse(
      { ok: true, status: "duplicate", lead_id: existing.id },
      200,
      cors,
    );
  }

  // 5) Insert do lead
  const userAgent = req.headers.get("user-agent");
  const insertRow = {
    name: payload.name,
    email: payload.email.toLowerCase(),
    telefone: payload.telefone ?? "",
    company: payload.company ?? "",
    cargo: payload.cargo ?? "",
    origem: leadSource.slug,
    kanban_stage: leadSource.default_stage || "novo",
    assigned_to: leadSource.default_assignee,
    assigned_at: leadSource.default_assignee ? new Date().toISOString() : null,
    source_id: payload.source_id ?? null,
    source_metadata: { source_name: leadSource.nome },
    utm_source: payload.utm?.source ?? null,
    utm_medium: payload.utm?.medium ?? null,
    utm_campaign: payload.utm?.campaign ?? null,
    utm_content: payload.utm?.content ?? null,
    utm_term: payload.utm?.term ?? null,
    custom_fields: payload.custom_fields ?? {},
    consent_marketing: payload.consent_marketing ?? false,
    ingest_ip: ip,
    ingest_user_agent: userAgent,
  };

  const { data: inserted, error: insertErr } = await admin
    .from("leads")
    .insert(insertRow)
    .select("id")
    .single();

  if (insertErr || !inserted) {
    console.error("Lead insert failed:", insertErr);
    await logIngest(admin, {
      source_slug: leadSource.slug,
      status: "error",
      ip,
      payload_hash: payloadHash,
      error: insertErr?.message?.slice(0, 500) ?? "insert_failed",
      duration_ms: Date.now() - startedAt,
    });
    return jsonResponse(
      { ok: false, status: "error", error: "Failed to create lead" },
      500,
      cors,
    );
  }

  const leadId = inserted.id as string;

  // 6) CAPI opcional — fire-and-forget, não bloqueia a resposta
  if (leadSource.capi_habilitado && payload.trigger_capi) {
    queueMicrotask(async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/send-meta-capi-event`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            lead_id: leadId,
            email: payload.email,
            telefone: payload.telefone,
            stage: leadSource.default_stage || "novo",
          }),
        });
        await res.text();
      } catch (err) {
        console.error("CAPI dispatch failed:", err);
      }
    });
  }

  await logIngest(admin, {
    source_slug: leadSource.slug,
    status: "created",
    lead_id: leadId,
    ip,
    payload_hash: payloadHash,
    duration_ms: Date.now() - startedAt,
  });

  return jsonResponse({ ok: true, status: "created", lead_id: leadId }, 201, cors);
});
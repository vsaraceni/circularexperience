// Edge Function para gerenciar fontes de leads (lead_sources).
// Centraliza operações sensíveis: criação, rotação e atualização.
// A geração de chave e o bcrypt hash precisam rodar server-side.
//
// Auth: valida JWT manualmente e exige role=admin via has_role().

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";
import { hashSync } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const GRACE_HOURS = 24;

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function generateApiKey(slug: string): { key: string; prefix: string } {
  // Slug curto sanitizado (a-z0-9 apenas), até 8 chars.
  const shortSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "src";
  // 32 bytes aleatórios em base64url.
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const random = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const key = `pk_${shortSlug}_${random}`;
  const prefix = key.slice(0, 8);
  return { key, prefix };
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9_]{3,32}$/.test(slug);
}

async function assertAdmin(authHeader: string | null): Promise<string> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw { status: 401, msg: "missing authorization header" };
  }
  const token = authHeader.replace("Bearer ", "");

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData.user) {
    throw { status: 401, msg: "invalid token" };
  }
  const userId = userData.user.id;

  // Checa role via has_role (security definer)
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: roleData, error: roleErr } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (roleErr || !roleData) {
    throw { status: 403, msg: "admin role required" };
  }
  return userId;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResp({ error: "method not allowed" }, 405);
  }

  let userId: string;
  try {
    userId = await assertAdmin(req.headers.get("authorization"));
  } catch (e) {
    const err = e as { status: number; msg: string };
    return jsonResp({ error: err.msg }, err.status);
  }

  const url = new URL(req.url);
  const action = url.pathname.split("/").pop() ?? "";
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  try {
    if (action === "create") {
      const slug = String(body.slug ?? "").toLowerCase().trim();
      const nome = String(body.nome ?? "").trim();
      if (!isValidSlug(slug)) {
        return jsonResp({ error: "slug inválido. Use a-z, 0-9, _ (3-32 chars)" }, 400);
      }
      if (!nome) return jsonResp({ error: "nome é obrigatório" }, 400);

      const { key, prefix } = generateApiKey(slug);
      const hash = hashSync(key, 10);

      const insertRow = {
        slug,
        nome,
        api_key_prefix: prefix,
        api_key_hash: hash,
        ativo: true,
        cors_origins: Array.isArray(body.cors_origins) ? body.cors_origins : [],
        rate_limit_per_min: Number(body.rate_limit_per_min ?? 30),
        default_stage: String(body.default_stage ?? "novo"),
        default_assignee: body.default_assignee ?? null,
        email_notificar: Array.isArray(body.email_notificar) ? body.email_notificar : [],
        capi_habilitado: Boolean(body.capi_habilitado ?? false),
        capi_action_source: String(body.capi_action_source ?? "website"),
        custom_field_schema: body.custom_field_schema ?? {},
        notas: body.notas ?? null,
        whatsapp_auto_send: Boolean(body.whatsapp_auto_send ?? false),
        whatsapp_channel_id: body.whatsapp_channel_id ?? null,
        produto_label: body.produto_label ?? null,
        whatsapp_agent_id: body.whatsapp_agent_id ?? null,
        created_by: userId,
      };

      const { data, error } = await admin
        .from("lead_sources")
        .insert(insertRow)
        .select("id, slug, nome, api_key_prefix")
        .single();

      if (error) {
        if (error.code === "23505") {
          return jsonResp({ error: "slug já existe" }, 409);
        }
        return jsonResp({ error: error.message }, 500);
      }

      return jsonResp({ source: data, api_key: key });
    }

    if (action === "rotate") {
      const id = String(body.id ?? "");
      if (!id) return jsonResp({ error: "id é obrigatório" }, 400);

      // Pega fonte atual
      const { data: current, error: fetchErr } = await admin
        .from("lead_sources")
        .select("id, slug, api_key_prefix, api_key_hash")
        .eq("id", id)
        .single();
      if (fetchErr || !current) {
        return jsonResp({ error: "fonte não encontrada" }, 404);
      }

      const { key, prefix } = generateApiKey(current.slug);
      const hash = hashSync(key, 10);
      const expiresAt = new Date(Date.now() + GRACE_HOURS * 60 * 60 * 1000).toISOString();

      const { error: updateErr } = await admin
        .from("lead_sources")
        .update({
          api_key_prefix: prefix,
          api_key_hash: hash,
          previous_api_key_prefix: current.api_key_prefix,
          previous_api_key_hash: current.api_key_hash,
          previous_api_key_expires_at: expiresAt,
        })
        .eq("id", id);

      if (updateErr) return jsonResp({ error: updateErr.message }, 500);

      return jsonResp({
        api_key: key,
        api_key_prefix: prefix,
        previous_expires_at: expiresAt,
      });
    }

    if (action === "update") {
      const id = String(body.id ?? "");
      if (!id) return jsonResp({ error: "id é obrigatório" }, 400);

      const allowed: Record<string, unknown> = {};
      const fields = [
        "nome", "ativo", "cors_origins", "rate_limit_per_min",
        "default_stage", "default_assignee", "email_notificar",
        "capi_habilitado", "capi_action_source", "custom_field_schema", "notas",
        "whatsapp_auto_send", "whatsapp_channel_id",
        "produto_label", "whatsapp_agent_id",
      ];
      for (const f of fields) {
        if (body[f] !== undefined) allowed[f] = body[f];
      }

      const { error } = await admin
        .from("lead_sources")
        .update(allowed)
        .eq("id", id);
      if (error) return jsonResp({ error: error.message }, 500);
      return jsonResp({ ok: true });
    }

    return jsonResp({ error: `unknown action: ${action}` }, 404);
  } catch (e) {
    console.error("manage-lead-source error:", e);
    return jsonResp({ error: (e as Error).message }, 500);
  }
});
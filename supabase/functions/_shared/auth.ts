// Autenticação de API key por origem.
// Estratégia: prefixo (8 chars iniciais) indexado em lead_sources +
// bcrypt-compare contra api_key_hash.
//
// Importante: usamos bcrypt do deno.land/x (porting puro JS, compatível com
// Edge Runtime). O pacote npm `bcrypt` depende de bindings nativos C++ e NÃO
// roda em Deno Edge.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";
// compareSync evita o uso de Web Workers, que não estão disponíveis
// no Edge Runtime do Supabase. compare() async dispara worker e quebra.
import { compareSync } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import type { LeadSource } from "./ingest-types.ts";

export class AuthError extends Error {
  constructor(public reason: string, public httpStatus: number) {
    super(reason);
    this.name = "AuthError";
  }
}

/**
 * Resolve uma API key crua na fonte (lead_sources) correspondente.
 * Retorna a source ou lança AuthError.
 */
export async function authenticateApiKey(
  supabase: SupabaseClient,
  rawKey: string | null,
): Promise<LeadSource> {
  if (!rawKey || rawKey.length < 16) {
    throw new AuthError("missing or malformed api key", 401);
  }

  const prefix = rawKey.slice(0, 8);

  const SELECT_COLS =
    "id, slug, nome, api_key_prefix, api_key_hash, previous_api_key_prefix, previous_api_key_hash, previous_api_key_expires_at, ativo, capi_habilitado, capi_action_source, email_notificar, default_stage, default_assignee, cors_origins, rate_limit_per_min, custom_field_schema, whatsapp_auto_send, whatsapp_channel_id";

  const { data: candidates, error } = await supabase
    .from("lead_sources")
    .select(SELECT_COLS)
    .eq("api_key_prefix", prefix)
    .eq("ativo", true);

  if (error) {
    throw new AuthError(`auth lookup failed: ${error.message}`, 500);
  }

  for (const candidate of candidates ?? []) {
    try {
      const match = compareSync(rawKey, candidate.api_key_hash);
      if (match) {
        return candidate as LeadSource;
      }
    } catch (err) {
      console.error("bcrypt compare failed:", err);
      throw new AuthError("verify failed", 500);
    }
  }

  // Tenta chave anterior dentro do período de graça (24h pós-rotação).
  const nowIso = new Date().toISOString();
  const { data: graceCandidates, error: graceError } = await supabase
    .from("lead_sources")
    .select(SELECT_COLS)
    .eq("previous_api_key_prefix", prefix)
    .eq("ativo", true)
    .gt("previous_api_key_expires_at", nowIso);

  if (graceError) {
    throw new AuthError(`auth lookup failed: ${graceError.message}`, 500);
  }

  for (const candidate of graceCandidates ?? []) {
    try {
      const match = compareSync(rawKey, candidate.previous_api_key_hash ?? "");
      if (match) {
        console.log(`[auth] grace key used for source ${candidate.slug}`);
        return candidate as LeadSource;
      }
    } catch (err) {
      console.error("bcrypt grace compare failed:", err);
      throw new AuthError("verify failed", 500);
    }
  }

  throw new AuthError("invalid api key", 401);
}

export function checkCors(req: Request, source: LeadSource): void {
  const origin = req.headers.get("origin");
  if (!origin) return; // request server-to-server
  if (!source.cors_origins || source.cors_origins.length === 0) return;
  const allowed = source.cors_origins.some(
    (o) => origin === o || origin.startsWith(o.replace(/\/$/, "")),
  );
  if (!allowed) {
    throw new AuthError(
      `origin ${origin} not allowed for source ${source.slug}`,
      403,
    );
  }
}
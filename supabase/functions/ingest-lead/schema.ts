// Tipos e schemas Zod compartilhados pelo ingest-lead.
// Usados também nos testes de unidade.

import { z } from "https://esm.sh/zod@3.23.8";

export const utmSchema = z
  .object({
    source: z.string().max(120).optional(),
    medium: z.string().max(120).optional(),
    campaign: z.string().max(255).optional(),
    content: z.string().max(255).optional(),
    term: z.string().max(255).optional(),
  })
  .optional();

export const ingestPayloadSchema = z.object({
  source: z.string().min(1).max(64),
  source_id: z.string().max(255).optional(),
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  telefone: z.string().max(40).optional(),
  company: z.string().max(255).optional(),
  cargo: z.string().max(120).optional(),
  utm: utmSchema,
  custom_fields: z.record(z.unknown()).optional(),
  consent_marketing: z.boolean().optional(),
  trigger_capi: z.boolean().optional(),
});

export type IngestPayload = z.infer<typeof ingestPayloadSchema>;

export interface LeadSource {
  id: string;
  slug: string;
  nome: string;
  api_key_prefix: string;
  api_key_hash: string;
  ativo: boolean;
  capi_habilitado: boolean;
  capi_action_source: string;
  email_notificar: string[];
  default_stage: string;
  default_assignee: string | null;
  cors_origins: string[];
  rate_limit_per_min: number;
  custom_field_schema: Record<string, unknown>;
}

export type IngestStatus =
  | "created"
  | "duplicate"
  | "rate_limited"
  | "invalid"
  | "forbidden"
  | "error";

export interface IngestResult {
  ok: boolean;
  status: IngestStatus;
  lead_id?: string;
  error?: string;
}

/** SHA-256 hex helper. Usado para hash da API key. */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Faz parse do header x-api-key no formato `prefix.secret`. */
export function parseApiKey(header: string | null): { prefix: string; secret: string } | null {
  if (!header) return null;
  const trimmed = header.trim();
  const dot = trimmed.indexOf(".");
  if (dot <= 0 || dot === trimmed.length - 1) return null;
  return { prefix: trimmed.slice(0, dot), secret: trimmed.slice(dot + 1) };
}
// Tipos e schemas Zod compartilhados pelo ingest-lead.
// Usados também nos testes de unidade (Vitest no front).

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
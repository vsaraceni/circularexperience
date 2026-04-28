// Testes unitários do ingest-lead.
// Foco nos blocos puros: schema (Zod), normalize, dedupe (com mock).
// O handler completo é testado via integração (curl) no Supabase.

import { describe, it, expect } from "vitest";
import { ingestPayloadSchema } from "../../supabase/functions/_shared/ingest-types";
import {
  normalizeEmail,
  normalizePhone,
  pickClientIp,
} from "../../supabase/functions/_shared/normalize";
import { findDuplicate } from "../../supabase/functions/_shared/dedupe";

describe("ingestPayloadSchema", () => {
  it("aceita payload mínimo válido", () => {
    const r = ingestPayloadSchema.safeParse({
      source: "lp_ce",
      name: "Maria",
      email: "maria@empresa.com",
    });
    expect(r.success).toBe(true);
  });

  it("rejeita email inválido", () => {
    const r = ingestPayloadSchema.safeParse({
      source: "lp_ce",
      name: "Maria",
      email: "not-an-email",
    });
    expect(r.success).toBe(false);
  });

  it("rejeita name vazio", () => {
    const r = ingestPayloadSchema.safeParse({
      source: "lp_ce",
      name: "",
      email: "maria@empresa.com",
    });
    expect(r.success).toBe(false);
  });

  it("aceita utm + custom_fields livres", () => {
    const r = ingestPayloadSchema.safeParse({
      source: "form_summit_2026",
      name: "Maria",
      email: "maria@empresa.com",
      utm: { source: "linkedin", campaign: "ce-q2" },
      custom_fields: { porte: "501-2000", interesse: true },
    });
    expect(r.success).toBe(true);
  });

  it("rejeita source ausente", () => {
    const r = ingestPayloadSchema.safeParse({
      name: "Maria",
      email: "maria@empresa.com",
    });
    expect(r.success).toBe(false);
  });
});

describe("normalize", () => {
  it("normaliza email pra lowercase + trim", () => {
    expect(normalizeEmail("  Maria@Empresa.COM ")).toBe("maria@empresa.com");
  });

  it("extrai dígitos do telefone", () => {
    expect(normalizePhone("+55 (11) 99999-8888")).toBe("5511999998888");
  });

  it("retorna null pra telefone vazio", () => {
    expect(normalizePhone(undefined)).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("abc")).toBeNull();
  });

  it("pickClientIp usa x-forwarded-for primeiro", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(pickClientIp(req)).toBe("1.2.3.4");
  });

  it("pickClientIp cai pra cf-connecting-ip", () => {
    const req = new Request("http://x", {
      headers: { "cf-connecting-ip": "9.9.9.9" },
    });
    expect(pickClientIp(req)).toBe("9.9.9.9");
  });
});

describe("findDuplicate (mock supabase)", () => {
  function buildSupabaseMock(strongResult: unknown, softResult: unknown) {
    const calls: string[] = [];
    const builder = (kind: "strong" | "soft"): any => ({
      select: () => builder(kind),
      eq: () => builder(kind),
      ilike: () => builder(kind),
      gte: () => builder(kind),
      order: () => builder(kind),
      limit: () => builder(kind),
      maybeSingle: async () => {
        calls.push(kind);
        return kind === "strong"
          ? { data: strongResult, error: null }
          : { data: softResult, error: null };
      },
    });
    let invocation = 0;
    return {
      from: () => {
        invocation += 1;
        return builder(invocation === 1 ? "strong" : "soft");
      },
      _calls: calls,
    } as unknown as Parameters<typeof findDuplicate>[0] & { _calls: string[] };
  }

  it("retorna lead_id existente quando match por (origem, source_id)", async () => {
    const supa = buildSupabaseMock({ id: "lead-strong" }, null);
    const result = await findDuplicate(supa, {
      origem: "meta_ads",
      sourceId: "fb-123",
      email: "x@y.com",
    });
    expect(result).toBe("lead-strong");
  });

  it("retorna lead_id existente quando match brando por email", async () => {
    const supa = buildSupabaseMock(null, { id: "lead-soft" });
    const result = await findDuplicate(supa, {
      origem: "lp_ce",
      sourceId: null,
      email: "x@y.com",
    });
    expect(result).toBe("lead-soft");
  });

  it("retorna null quando nenhum match", async () => {
    const supa = buildSupabaseMock(null, null);
    const result = await findDuplicate(supa, {
      origem: "lp_ce",
      sourceId: null,
      email: "x@y.com",
    });
    expect(result).toBeNull();
  });
});
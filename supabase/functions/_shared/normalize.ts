// Normalização de payload de ingest. Funções puras, fáceis de testar.

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

import { toE164 } from "./phone.ts";

/**
 * Retorna telefone em formato E.164 (`+5531997246145`) ou null se não for normalizável.
 */
export function normalizePhone(phone: string | undefined | null): string | null {
  if (!phone) return null;
  const r = toE164(phone);
  return r.ok ? r.value : null;
}

export function pickClientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return null;
}

export function pickUserAgent(req: Request): string | null {
  return req.headers.get("user-agent");
}

export async function payloadHash(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
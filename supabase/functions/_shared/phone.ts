// Mesma lógica de src/lib/phone.ts (duplicada porque edge functions e front
// não compartilham bundles).
export interface PhoneResult { ok: boolean; value: string; error?: string }

const E164 = /^\+\d{11,15}$/;
export function isE164(v: string | null | undefined): boolean { return !!v && E164.test(v); }

export function toE164(input: string | null | undefined): PhoneResult {
  if (input == null) return { ok: false, value: "", error: "Telefone vazio" };
  const raw = String(input).trim();
  if (!raw || raw === "---" || raw === "--") return { ok: false, value: "", error: "Telefone vazio" };
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (!digits) return { ok: false, value: "", error: "Sem dígitos" };
  const len = digits.length;
  if (hasPlus) {
    if (len >= 11 && len <= 15) return { ok: true, value: "+" + digits };
    return { ok: false, value: "", error: "Fora do padrão E.164" };
  }
  if ((len === 12 || len === 13) && digits.startsWith("55")) return { ok: true, value: "+" + digits };
  if (len === 10 || len === 11) return { ok: true, value: "+55" + digits };
  if (len >= 11 && len <= 15) return { ok: true, value: "+" + digits };
  return { ok: false, value: "", error: "Inclua DDD" };
}

/**
 * Normaliza um telefone para o formato E.164 (+5531997246145).
 * Brasil é o padrão quando não há "+".
 */
export interface PhoneResult {
  ok: boolean;
  value: string;
  error?: string;
}

const E164 = /^\+\d{11,15}$/;

export function isE164(value: string | null | undefined): boolean {
  return !!value && E164.test(value);
}

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
    return { ok: false, value: "", error: "Quantidade de dígitos fora do padrão E.164" };
  }

  // BR-first
  if ((len === 12 || len === 13) && digits.startsWith("55")) {
    return { ok: true, value: "+" + digits };
  }
  if (len === 10 || len === 11) {
    return { ok: true, value: "+55" + digits };
  }
  if (len >= 11 && len <= 15) {
    return { ok: true, value: "+" + digits };
  }
  return { ok: false, value: "", error: "Inclua DDD e, se internacional, o código do país com +" };
}

export function formatPhoneDisplay(e164: string | null | undefined): string {
  if (!e164) return "";
  if (!isE164(e164)) return e164;
  const d = e164.slice(1);
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) {
    const ddd = d.slice(2, 4);
    const rest = d.slice(4);
    if (rest.length === 9) return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
    if (rest.length === 8) return `+55 (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }
  return e164;
}

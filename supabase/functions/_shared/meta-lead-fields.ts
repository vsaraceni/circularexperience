export type MetaLeadField = { name?: string; values?: string[] };

const WORK_EMAIL_ALIASES = new Set([
  "work_email",
  "business_email",
  "company_email",
  "corporate_email",
  "email_profissional",
  "e_mail_profissional",
  "email_corporativo",
  "e_mail_corporativo",
  "email_de_trabalho",
  "e_mail_de_trabalho",
  "email_trabalho",
  "e_mail_trabalho",
  "email_comercial",
  "e_mail_comercial",
  "email_institucional",
  "e_mail_institucional",
]);

const PERSONAL_EMAIL_ALIASES = new Set([
  "email",
  "e_mail",
  "email_address",
  "email_pessoal",
  "e_mail_pessoal",
  "personal_email",
]);

const PROFESSIONAL_HINTS = [
  "profissional",
  "corporativo",
  "trabalho",
  "empresa",
  "comercial",
  "institucional",
  "business",
  "work",
  "company",
  "corporate",
];

const GENERIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "gmail.com.br",
  "hotmail.com",
  "hotmail.com.br",
  "outlook.com",
  "outlook.com.br",
  "yahoo.com",
  "yahoo.com.br",
  "icloud.com",
  "live.com",
  "live.com.br",
  "uol.com.br",
  "bol.com.br",
  "terra.com.br",
]);

export function normalizeMetaFieldKey(input: string): string {
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

export function isGenericEmail(email: string | null | undefined): boolean {
  const domain = String(email || "").trim().toLowerCase().split("@")[1] || "";
  return GENERIC_EMAIL_DOMAINS.has(domain);
}

function firstEmail(value: string | undefined): string {
  const match = String(value || "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0]?.trim() ?? "";
}

export function pickMetaLeadEmails(fieldData: MetaLeadField[] = []) {
  const fields: Record<string, string> = {};
  const rawKeys: string[] = [];

  for (const field of fieldData ?? []) {
    const key = normalizeMetaFieldKey(field.name || "");
    if (!key) continue;
    rawKeys.push(String(field.name || ""));
    if (!fields[key]) fields[key] = field.values?.[0] ?? "";
  }

  let personalEmail = "";
  for (const alias of PERSONAL_EMAIL_ALIASES) {
    personalEmail = firstEmail(fields[alias]);
    if (personalEmail) break;
  }

  let workEmailRaw = "";
  for (const alias of WORK_EMAIL_ALIASES) {
    workEmailRaw = firstEmail(fields[alias]);
    if (workEmailRaw) break;
  }

  if (!workEmailRaw) {
    for (const [key, value] of Object.entries(fields)) {
      const email = firstEmail(value);
      if (!email) continue;
      const looksLikeEmailField = key.includes("email") || key.includes("e_mail") || key.includes("mail");
      const looksProfessional = PROFESSIONAL_HINTS.some((hint) => key.includes(hint));
      if (looksLikeEmailField && looksProfessional) {
        workEmailRaw = email;
        break;
      }
    }
  }

  if (!personalEmail) {
    for (const value of Object.values(fields)) {
      personalEmail = firstEmail(value);
      if (personalEmail) break;
    }
  }

  return { fields, rawKeys, personalEmail, workEmailRaw };
}
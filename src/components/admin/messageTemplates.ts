// Channel config and variable utilities — shared across components

export interface MessageTemplate {
  id: string;
  stage: string;
  channel: "email" | "whatsapp" | "linkedin";
  title: string;
  subject?: string | null;
  body: string;
  sort_order: number;
  is_active?: boolean;
  product_id?: string | null;
}

export interface TemplateWithOverride extends MessageTemplate {
  /** The user's override body, if any */
  override_body?: string | null;
  override_id?: string | null;
}

// Manual variables that need user input before copying
export const MANUAL_VARIABLES = [
  "{{dia1}}", "{{dia2}}", "{{horário}}", "{{mês}}", "{{prazo}}",
];

export const CHANNEL_CONFIG: Record<string, { label: string; color: string }> = {
  email: { label: "E-mail", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  whatsapp: { label: "WhatsApp", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  linkedin: { label: "LinkedIn", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
};

export const STAGE_ORDER = [
  "novo", "boas_vindas", "em_contato", "call_agendada", "proposta", "nutricao", "tratativas",
];

export const STAGE_LABELS: Record<string, string> = {
  novo: "Novo",
  boas_vindas: "Boas-Vindas",
  em_contato: "Em Contato",
  call_agendada: "Call Agendada",
  proposta: "Proposta",
  nutricao: "Nutrição",
  tratativas: "Tratativas",
};

const COMPOUND_PREFIXES = [
  "maria", "ana", "joão", "jose", "josé", "luiz", "luis",
  "pedro", "carlos", "paulo", "marco", "jean", "karl",
];

export function extractFirstName(fullName: string): string {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0] || "";
  const first = parts[0].toLowerCase();
  if (COMPOUND_PREFIXES.includes(first) && parts.length >= 2) {
    return `${parts[0]} ${parts[1]}`;
  }
  return parts[0];
}

export function replaceVariables(
  text: string,
  lead: { name: string; company?: string | null; cargo?: string | null },
  assignedProfile?: { full_name: string | null; cargo?: string | null } | null,
  extra?: { data_envio_proposta?: string | null },
): string {
  let result = text;
  result = result.replace(/\{\{nome\}\}/g, extractFirstName(lead.name));
  result = result.replace(/\{\{empresa\}\}/g, lead.company || "");
  result = result.replace(/\{\{cargo\}\}/g, lead.cargo || "");

  const specialistName = assignedProfile?.full_name || "nosso especialista";
  result = result.replace(/\{\{nome_especialista\}\}/g, specialistName);

  // Use profile cargo if available, otherwise fallback to name heuristic
  let specialistRole = assignedProfile?.cargo || "";
  if (!specialistRole) {
    if (assignedProfile?.full_name?.toLowerCase().includes("vinicius")) {
      specialistRole = "Diretor Executivo do Movimento Circular";
    } else if (assignedProfile?.full_name?.toLowerCase().includes("alinye")) {
      specialistRole = "Gestora de Parcerias do Movimento Circular";
    } else {
      specialistRole = "do Movimento Circular";
    }
  }
  result = result.replace(/\{\{cargo_especialista\}\}/g, specialistRole);

  // Auto-replace proposal submission date
  if (extra?.data_envio_proposta) {
    result = result.replace(/\{\{data_envio_proposta\}\}/g, extra.data_envio_proposta);
  }

  return result;
}

export function hasManualVariables(text: string): boolean {
  return MANUAL_VARIABLES.some((v) => text.includes(v));
}

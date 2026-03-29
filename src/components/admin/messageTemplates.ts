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
}

export interface TemplateWithOverride extends MessageTemplate {
  /** The user's override body, if any */
  override_body?: string | null;
  override_id?: string | null;
}

// Manual variables that need user input before copying
export const MANUAL_VARIABLES = [
  "{{dia1}}", "{{dia2}}", "{{horário}}", "{{mês}}", "{{prazo}}",
  "{{nome_especialista}}", "{{cargo_especialista}}", "{{data_envio_proposta}}",
];

export const CHANNEL_CONFIG: Record<string, { label: string; color: string }> = {
  email: { label: "E-mail", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  whatsapp: { label: "WhatsApp", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  linkedin: { label: "LinkedIn", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
};

export const STAGE_ORDER = [
  "novo", "boas_vindas", "em_contato", "call_agendada", "proposta", "nutricao",
];

export const STAGE_LABELS: Record<string, string> = {
  novo: "Novo",
  boas_vindas: "Boas-Vindas",
  em_contato: "Em Contato",
  call_agendada: "Call Agendada",
  proposta: "Proposta",
  nutricao: "Nutrição",
};

export function replaceVariables(
  text: string,
  lead: { name: string; company?: string | null; cargo?: string | null },
  assignedProfile?: { full_name: string | null; cargo?: string | null } | null,
): string {
  let result = text;
  result = result.replace(/\{\{nome\}\}/g, lead.name || "");
  result = result.replace(/\{\{empresa\}\}/g, lead.company || "");
  result = result.replace(/\{\{cargo\}\}/g, lead.cargo || "");

  const specialistName = assignedProfile?.full_name || "nosso especialista";
  result = result.replace(/\{\{nome_especialista\}\}/g, specialistName);

  let specialistRole = "do Movimento Circular";
  if (assignedProfile?.full_name?.toLowerCase().includes("vinicius")) {
    specialistRole = "Diretor Executivo do Movimento Circular";
  } else if (assignedProfile?.full_name?.toLowerCase().includes("alinye")) {
    specialistRole = "Gestora de Parcerias do Movimento Circular";
  }
  result = result.replace(/\{\{cargo_especialista\}\}/g, specialistRole);

  return result;
}

export function hasManualVariables(text: string): boolean {
  return MANUAL_VARIABLES.some((v) => text.includes(v));
}

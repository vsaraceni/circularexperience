import { supabase } from "@/integrations/supabase/client";

export interface ManualOriginInput {
  email: string;
  telefone: string;
  origem: string;
  origem_detalhe: string;
}

export interface CreateManualLeadParams {
  name: string;
  email: string;
  telefone?: string;
  company?: string;
  cargo?: string;
  origem: string;
  origem_detalhe?: string | null;
  product_id?: string | null;
  mensagem?: string | null;
  lead_heat?: number | null;
  assigned_to?: string | null;
  /** Estágio inicial do lead no Kanban. Padrão: "novo". */
  stage?: string;
  /** status do lead. Padrão: "new". */
  status?: string;
  /** Quando true, marca welcome_sent para inibir o trigger de boas-vindas. */
  suppressWelcome?: boolean;
}

/**
 * Cria um lead "real" a partir do CRM (entrada manual ou proposta manual).
 * - origens manuais têm whatsapp_auto_send=false, então o trigger de WhatsApp não dispara
 * - suppressWelcome=true marca welcome_sent e inibe o e-mail automático de boas-vindas
 */
export async function createManualLead(
  params: CreateManualLeadParams,
): Promise<{ id: string } | { error: string }> {
  const now = new Date().toISOString();
  const suppress = params.suppressWelcome ?? false;

  const { data, error } = await supabase
    .from("leads")
    .insert({
      name: params.name || "",
      email: params.email,
      telefone: params.telefone || "",
      company: params.company || "",
      cargo: params.cargo || "",
      origem: params.origem,
      origem_detalhe: params.origem_detalhe || null,
      product_id: params.product_id || null,
      mensagem: params.mensagem || null,
      lead_heat: params.lead_heat ?? null,
      assigned_to: params.assigned_to || null,
      assigned_at: params.assigned_to ? now : null,
      status: params.status ?? "new",
      kanban_stage: params.stage ?? "novo",
      stage_updated_at: now,
      last_activity_at: now,
      welcome_sent: suppress,
      welcome_sent_at: suppress ? now : null,
    } as any)
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

/**
 * Lead criado como efeito de uma proposta manual: entra direto em "proposta"
 * e nunca dispara boas-vindas automáticas.
 */
export async function createManualLeadForProposal(params: {
  origin: ManualOriginInput;
  contact_name: string;
  contact_role: string;
  company_name: string;
}): Promise<{ id: string } | { error: string }> {
  return createManualLead({
    name: params.contact_name,
    email: params.origin.email,
    telefone: params.origin.telefone,
    company: params.company_name,
    cargo: params.contact_role,
    origem: params.origin.origem,
    origem_detalhe: params.origin.origem_detalhe,
    status: "converted",
    stage: "proposta",
    suppressWelcome: true,
  });
}

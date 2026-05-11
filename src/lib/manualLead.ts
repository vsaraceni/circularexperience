import { supabase } from "@/integrations/supabase/client";

export interface ManualOriginInput {
  email: string;
  telefone: string;
  origem: string;
  origem_detalhe: string;
}

/**
 * Cria um lead "real" para uma proposta gerada manualmente pelo time interno.
 * - usa o e-mail informado pelo SDR (não fantasma)
 * - já entra direto no estágio "proposta"
 * - marca welcome_sent=true para inibir o trigger de boas-vindas
 * - origens manuais têm whatsapp_auto_send=false, então o trigger de WhatsApp também não dispara
 */
export async function createManualLeadForProposal(params: {
  origin: ManualOriginInput;
  contact_name: string;
  contact_role: string;
  company_name: string;
}): Promise<{ id: string } | { error: string }> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      name: params.contact_name || "",
      email: params.origin.email,
      telefone: params.origin.telefone || "",
      company: params.company_name || "",
      cargo: params.contact_role || "",
      origem: params.origin.origem,
      origem_detalhe: params.origin.origem_detalhe || null,
      status: "converted",
      kanban_stage: "proposta",
      stage_updated_at: now,
      last_activity_at: now,
      welcome_sent: true,
      welcome_sent_at: now,
    } as any)
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { id: data.id };
}

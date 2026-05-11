import { supabase } from "@/integrations/supabase/client";

export interface NewLeadInput {
  contact_email: string;
  contact_phone: string;
  origem_slug: string;
  origem_detalhe: string | null;
}

export interface CreateLeadFromProposalArgs {
  company_name: string;
  contact_name: string;
  contact_role: string;
  new_lead: NewLeadInput;
}

/**
 * Cria um lead "real" pra acompanhar proposta gerada manualmente no CRM.
 * Substitui o fluxo antigo que criava lead com email-fantasma `manual-<slug>@noemail.com`.
 * O lead entra direto em status converted + kanban_stage proposta pra aparecer no funil.
 *
 * Marca welcome_sent=true pra evitar disparo automático de email/WA na criação.
 */
export async function createLeadFromProposalManual(args: CreateLeadFromProposalArgs): Promise<{ id: string } | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      name: args.contact_name || "",
      email: args.new_lead.contact_email || "",
      telefone: args.new_lead.contact_phone || "",
      company: args.company_name || "",
      cargo: args.contact_role || "",
      origem: args.new_lead.origem_slug,
      origem_detalhe: args.new_lead.origem_detalhe,
      status: "converted",
      kanban_stage: "proposta",
      welcome_sent: true,
      stage_updated_at: now,
      last_activity_at: now,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return { id: data.id };
}

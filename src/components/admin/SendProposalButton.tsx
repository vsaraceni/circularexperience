import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Send, Mail, Package, Globe } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTemplatesWithOverrides } from "@/hooks/useMessageTemplates";
import { replaceVariables, type TemplateWithOverride } from "@/components/admin/messageTemplates";
import type { Proposal } from "@/pages/admin/Proposals";

interface Props {
  proposal: Proposal;
  onStatusChange?: (id: string, status: string) => void;
}

const formatDateBR = (d = new Date()) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

const SendProposalButton: React.FC<Props> = ({ proposal, onStatusChange }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { data: templates = [], isLoading } = useTemplatesWithOverrides(
    "proposta",
    user?.id,
    proposal.product_id ?? null,
  );

  const emailTemplates = templates.filter((t) => t.channel === "email");
  const productTemplates = emailTemplates.filter((t) => t.product_id === proposal.product_id && proposal.product_id);
  const globalTemplates = emailTemplates.filter((t) => !t.product_id);

  const handleSend = async (template: TemplateWithOverride) => {
    if (!proposal.lead_id) {
      toast.error("Esta proposta não tem lead associado.");
      return;
    }

    // Fetch lead + assigned profile
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("id, name, email, company, cargo, assigned_to")
      .eq("id", proposal.lead_id)
      .single();

    if (leadErr || !lead?.email || lead.email.endsWith("@noemail.com")) {
      toast.error("Esta proposta não tem e-mail válido associado.");
      return;
    }

    let assignedProfile = null;
    if (lead.assigned_to) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, cargo")
        .eq("id", lead.assigned_to)
        .single();
      assignedProfile = prof;
    }

    const body = template.override_body || template.body;
    const subject = template.subject || `Proposta — ${proposal.title}`;
    const extra = { data_envio_proposta: formatDateBR() };

    const filledBody = replaceVariables(body, lead, assignedProfile, extra);
    const filledSubject = replaceVariables(subject, lead, assignedProfile, extra);

    const url = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(lead.email)}&su=${encodeURIComponent(filledSubject)}&body=${encodeURIComponent(filledBody)}`;
    window.open(url, "_blank");

    // Log activity
    await supabase.from("lead_activities").insert({
      lead_id: lead.id,
      user_id: user?.id,
      activity_type: "proposta_enviada_email",
      content: `Gmail aberto com template: ${template.title}`,
      metadata: { template_id: template.id, proposal_id: proposal.id },
    });

    setOpen(false);

    toast.success("Gmail aberto. Anexe o PDF antes de enviar.", {
      action: proposal.status !== "enviada" && onStatusChange
        ? { label: "Marcar como Enviada", onClick: () => onStatusChange(proposal.id, "enviada") }
        : undefined,
      duration: 8000,
    });
  };

  const renderTemplate = (t: TemplateWithOverride) => (
    <button
      key={t.id}
      onClick={() => handleSend(t)}
      className="w-full text-left px-3 py-2 rounded-md hover:bg-accent/10 transition-colors flex items-start gap-2"
    >
      <Mail className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
        {t.subject && <p className="text-xs text-muted-foreground truncate">{t.subject}</p>}
      </div>
    </button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title="Enviar por e-mail (Gmail)">
          <Send className="h-4 w-4" style={{ color: 'hsl(var(--color-brand))' }} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground p-3">Carregando templates…</p>
        ) : emailTemplates.length === 0 ? (
          <p className="text-sm text-muted-foreground p-3">
            Nenhum template de e-mail configurado para o estágio Proposta.
          </p>
        ) : (
          <div className="space-y-2">
            {productTemplates.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Package className="h-3 w-3" /> Para este produto
                </div>
                <div className="space-y-0.5">{productTemplates.map(renderTemplate)}</div>
              </div>
            )}
            {globalTemplates.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Globe className="h-3 w-3" /> Geral
                </div>
                <div className="space-y-0.5">{globalTemplates.map(renderTemplate)}</div>
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default SendProposalButton;

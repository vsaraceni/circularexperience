import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Mail, Building2, Briefcase, Calendar, Tag, User, Phone, Send, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Lead {
  id: string;
  name: string;
  email: string;
  cargo: string;
  company: string;
  telefone: string;
  status: string;
  created_at: string;
  origem: string;
  welcome_sent: boolean;
}

interface LeadListProps {
  leads: Lead[];
  onGenerateProposal: (lead: Lead) => void;
  onLeadUpdated?: () => void;
}

const LeadList: React.FC<LeadListProps> = ({ leads, onGenerateProposal, onLeadUpdated }) => {
  const [sendingWelcome, setSendingWelcome] = useState<string | null>(null);

  const handleSendWelcome = async (lead: Lead) => {
    setSendingWelcome(lead.id);
    try {
      const { data, error } = await supabase.functions.invoke("send-welcome-email", {
        body: {
          lead_id: lead.id,
          name: lead.name,
          email: lead.email,
          company: lead.company,
          cargo: lead.cargo,
        },
      });

      if (error) throw error;
      if (data?.success) {
        toast.success(data.skipped ? "E-mail já havia sido enviado" : "E-mail de boas-vindas enviado!");
        onLeadUpdated?.();
      } else {
        throw new Error(data?.error || "Erro desconhecido");
      }
    } catch (err: any) {
      console.error("Error sending welcome:", err);
      toast.error("Erro ao enviar e-mail: " + (err.message || "Tente novamente"));
    } finally {
      setSendingWelcome(null);
    }
  };

  if (leads.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Mail className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="text-lg">Nenhum lead novo.</p>
        <p className="text-sm mt-1">Os leads do formulário da LP aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {leads.map((lead) => (
        <div
          key={lead.id}
          className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate">{lead.company || "Sem empresa"}</h3>
              <Badge variant={lead.status === "new" ? "default" : "secondary"} className="text-xs shrink-0">
                {lead.status === "new" ? "Novo" : lead.status}
              </Badge>
              {lead.welcome_sent && (
                <Badge variant="outline" className="text-xs shrink-0 gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Welcome enviado
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {lead.name}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {lead.email}
              </span>
              {lead.telefone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {lead.telefone}
                </span>
              )}
              {lead.cargo && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  {lead.cargo}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(lead.created_at).toLocaleDateString("pt-BR")}
              </span>
              <span className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                {lead.origem}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {!lead.welcome_sent && (
              <Button
                onClick={() => handleSendWelcome(lead)}
                size="sm"
                variant="outline"
                disabled={sendingWelcome === lead.id}
              >
                {sendingWelcome === lead.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                Boas-Vindas
              </Button>
            )}
            <Button
              onClick={() => onGenerateProposal(lead)}
              size="sm"
            >
              <FileText className="h-4 w-4 mr-1" />
              Gerar Proposta
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LeadList;

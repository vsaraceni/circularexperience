import { Button } from "@/components/ui/button";
import { FileText, Mail, Building2, Briefcase, Calendar, Tag, User, Phone } from "lucide-react";

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
}

interface LeadListProps {
  leads: Lead[];
  onGenerateProposal: (lead: Lead) => void;
}

const LeadList: React.FC<LeadListProps> = ({ leads, onGenerateProposal }) => {
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
            <h3 className="font-semibold text-foreground truncate">{lead.company || "Sem empresa"}</h3>
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
          <Button
            onClick={() => onGenerateProposal(lead)}
            size="sm"
            className="flex-shrink-0"
          >
            <FileText className="h-4 w-4 mr-1" />
            Gerar Proposta
          </Button>
        </div>
      ))}
    </div>
  );
};

export default LeadList;

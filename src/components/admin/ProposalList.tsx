import { Button } from "@/components/ui/button";
import { Edit, Trash2, ExternalLink, Copy, CheckCircle, XCircle, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";
import type { Proposal } from "@/pages/admin/Proposals";
import PdfExporter from "@/components/pdf/PdfExporter";
import { Badge } from "@/components/ui/badge";

interface ProposalListProps {
  proposals: Proposal[];
  onEdit: (p: Proposal) => void;
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  showStatusActions?: boolean;
  statusFilter?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  rascunho: { label: "Rascunho", variant: "outline" },
  enviada: { label: "Enviada", variant: "default" },
  fechada: { label: "Fechada", variant: "secondary" },
  perdida: { label: "Perdida", variant: "destructive" },
};

const ProposalList: React.FC<ProposalListProps> = ({
  proposals,
  onEdit,
  onDelete,
  onStatusChange,
  showStatusActions = true,
  statusFilter,
}) => {
  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/proposta/${slug}`);
    toast.success("Link copiado!");
  };

  if (proposals.length === 0) {
    const emptyMessages: Record<string, string> = {
      rascunho: "Nenhum rascunho de proposta.",
      enviada: "Nenhuma proposta enviada.",
      fechada: "Nenhuma proposta fechada ainda.",
      perdida: "Nenhuma proposta perdida.",
    };
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">{statusFilter ? emptyMessages[statusFilter] : "Nenhuma proposta criada ainda."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {proposals.map((p) => {
        const status = (p as any).status || "rascunho";
        const config = statusConfig[status] || statusConfig.rascunho;

        return (
          <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">{p.title}</h3>
                <Badge variant={config.variant} className="text-xs flex-shrink-0">
                  {config.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">{p.company_name} — {p.contact_name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {p.event_date && `Evento: ${new Date(p.event_date).toLocaleDateString("pt-BR")}`}
                {p.valid_until && ` • Válida até: ${new Date(p.valid_until).toLocaleDateString("pt-BR")}`}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
              {/* Rascunho → Enviada */}
              {showStatusActions && onStatusChange && status === "rascunho" && (
                <Button variant="ghost" size="icon" onClick={() => onStatusChange(p.id, "enviada")} title="Marcar como Enviada">
                  <Send className="h-4 w-4 text-blue-600" />
                </Button>
              )}
              {/* Enviada → Fechada / Perdida */}
              {showStatusActions && onStatusChange && status === "enviada" && (
                <>
                  <Button variant="ghost" size="icon" onClick={() => onStatusChange(p.id, "fechada")} title="Marcar como Fechada">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onStatusChange(p.id, "perdida")} title="Marcar como Perdida">
                    <XCircle className="h-4 w-4 text-destructive" />
                  </Button>
                </>
              )}
              {/* Fechada/Perdida → Enviada */}
              {showStatusActions && onStatusChange && (status === "fechada" || status === "perdida") && (
                <Button variant="ghost" size="icon" onClick={() => onStatusChange(p.id, "enviada")} title="Reverter para Enviada">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
              <PdfExporter proposal={p} />
              <Button variant="ghost" size="icon" onClick={() => copyLink(p.slug)} title="Copiar link">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => window.open(`/proposta/${p.slug}`, "_blank")} title="Ver proposta">
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onEdit(p)} title="Editar">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(p.id)} title="Excluir">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProposalList;

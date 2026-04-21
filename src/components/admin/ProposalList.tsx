import { Button } from "@/components/ui/button";
import { Edit, Trash2, CheckCircle, XCircle, RotateCcw, Send, MoreVertical } from "lucide-react";
import type { Proposal } from "@/pages/admin/Proposals";
import PdfExporter from "@/components/pdf/PdfExporter";
import { Badge } from "@/components/ui/badge";
import SendProposalButton from "@/components/admin/SendProposalButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
              {/* 1. Editar */}
              <Button variant="ghost" size="icon" onClick={() => onEdit(p)} title="Editar proposta">
                <Edit className="h-4 w-4" />
              </Button>

              <div className="w-px h-5 bg-border mx-1" aria-hidden />

              {/* 2. Baixar + Enviar + Marcar status */}
              <PdfExporter proposal={p} />
              <SendProposalButton proposal={p} onStatusChange={onStatusChange} />

              {showStatusActions && onStatusChange && status === "rascunho" && (
                <Button variant="ghost" size="icon" onClick={() => onStatusChange(p.id, "enviada")} title="Marcar como Enviada">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </Button>
              )}
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
              {showStatusActions && onStatusChange && (status === "fechada" || status === "perdida") && (
                <Button variant="ghost" size="icon" onClick={() => onStatusChange(p.id, "enviada")} title="Reverter para Enviada">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}

              <div className="w-px h-5 bg-border mx-1" aria-hidden />

              {/* 3. Menu kebab: excluir */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" title="Mais ações">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onDelete(p.id)}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir proposta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProposalList;

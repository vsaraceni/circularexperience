import { Button } from "@/components/ui/button";
import { Edit, Trash2, ExternalLink, Copy, FileDown } from "lucide-react";
import { toast } from "sonner";
import type { Proposal } from "@/pages/admin/Proposals";
import PdfExporter from "@/components/pdf/PdfExporter";

interface ProposalListProps {
  proposals: Proposal[];
  onEdit: (p: Proposal) => void;
  onDelete: (id: string) => void;
}

const ProposalList: React.FC<ProposalListProps> = ({ proposals, onEdit, onDelete }) => {
  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/proposta/${slug}`);
    toast.success("Link copiado!");
  };

  if (proposals.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">Nenhuma proposta criada ainda.</p>
        <p className="text-sm mt-1">Clique em "Nova Proposta" para começar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {proposals.map((p) => (
        <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate">{p.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{p.company_name} — {p.contact_name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {p.event_date && `Evento: ${new Date(p.event_date).toLocaleDateString("pt-BR")}`}
              {p.valid_until && ` • Válida até: ${new Date(p.valid_until).toLocaleDateString("pt-BR")}`}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
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
      ))}
    </div>
  );
};

export default ProposalList;

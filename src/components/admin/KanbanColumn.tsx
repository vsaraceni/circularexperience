import { useDroppable } from "@dnd-kit/core";
import LeadCard from "./LeadCard";
import type { Lead } from "./LeadList";

export interface KanbanStage {
  id: string;
  label: string;
  color: string;
}

interface KanbanColumnProps {
  stage: KanbanStage;
  leads: Lead[];
  profiles?: { id: string; full_name: string | null }[];
  proposals: { id: string; lead_id?: string; investment: string }[];
  onOpenDrawer: (lead: Lead) => void;
  onQuickAction: (lead: Lead, action: string) => void;
}

function parseInvestment(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

function formatBRL(val: number): string {
  if (val === 0) return "";
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ stage, leads, profiles, proposals, onOpenDrawer, onQuickAction }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  const totalInvestment = proposals.reduce((sum, p) => sum + parseInvestment(p.investment), 0);

  return (
    <div className="flex flex-col min-w-[260px] max-w-[280px] shrink-0">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-lg border border-b-0 border-border"
        style={{ borderTopColor: stage.color, borderTopWidth: 3 }}
      >
        <span className="font-semibold text-sm text-foreground">{stage.label}</span>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {leads.length}
        </span>
        {totalInvestment > 0 && (
          <span className="text-xs text-muted-foreground ml-auto truncate">
            {formatBRL(totalInvestment)}
          </span>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 p-2 space-y-2 rounded-b-lg border border-border min-h-[200px] overflow-y-auto max-h-[calc(100vh-240px)] transition-colors ${
          isOver ? "bg-primary/5 border-primary/30" : "bg-muted/30"
        }`}
      >
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              profiles={profiles}
              onOpenDrawer={onOpenDrawer}
              onQuickAction={onQuickAction}
            />
          ))}

        {leads.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8 opacity-60">
            Arraste leads aqui
          </p>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;

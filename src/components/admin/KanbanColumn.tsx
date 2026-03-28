import { useDroppable } from "@dnd-kit/core";
import LeadCard from "./LeadCard";
import { getUrgencyLevel } from "./UrgencyBadge";
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
  let multiplier = 1;
  let rest = val;
  const mMatch = val.match(/(\d+)\s*x\s*/i);
  if (mMatch) {
    multiplier = parseInt(mMatch[1], 10) || 1;
    rest = val.slice(mMatch.index! + mMatch[0].length);
  }
  const cleaned = rest.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".");
  return (parseFloat(cleaned) || 0) * multiplier;
}

function formatBRL(val: number): string {
  if (val === 0) return "";
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const URGENCY_ORDER = { critical: 0, warning: 1, normal: 2 };

function sortByUrgency(leads: Lead[]): Lead[] {
  return [...leads].sort((a, b) => {
    const la = getUrgencyLevel(a.kanban_stage, a.stage_updated_at || null, a.last_activity_at || null);
    const lb = getUrgencyLevel(b.kanban_stage, b.stage_updated_at || null, b.last_activity_at || null);
    const diff = URGENCY_ORDER[la] - URGENCY_ORDER[lb];
    if (diff !== 0) return diff;
    // Older first within same level
    const da = new Date(a.stage_updated_at || a.created_at || 0).getTime();
    const db = new Date(b.stage_updated_at || b.created_at || 0).getTime();
    return da - db;
  });
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ stage, leads, profiles, proposals, onOpenDrawer, onQuickAction }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  const totalInvestment = proposals.reduce((sum, p) => sum + parseInvestment(p.investment), 0);
  const leadsWithProposals = new Set(proposals.filter((p) => p.lead_id).map((p) => p.lead_id));

  const criticalCount = leads.filter((l) =>
    getUrgencyLevel(l.kanban_stage, l.stage_updated_at || null, l.last_activity_at || null) === "critical"
  ).length;

  const sortedLeads = sortByUrgency(leads);

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
        {criticalCount > 0 && (
          <span className="text-xs text-red-500 font-medium">
            · {criticalCount} atrasado{criticalCount > 1 ? "s" : ""}
          </span>
        )}
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
        {sortedLeads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            profiles={profiles}
            hasProposal={leadsWithProposals.has(lead.id)}
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

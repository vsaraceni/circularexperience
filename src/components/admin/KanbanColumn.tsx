import { useDroppable } from "@dnd-kit/core";
import { ArrowDown, Info } from "lucide-react";
import LeadCard from "./LeadCard";
import { getUrgencyLevel, SLA_CONFIG } from "./UrgencyBadge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
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
  followUpsByLead?: Record<string, { hasToday: boolean; hasOverdue: boolean }>;
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

const KanbanColumn: React.FC<KanbanColumnProps> = ({ stage, leads, profiles, proposals, followUpsByLead = {}, onOpenDrawer, onQuickAction }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  const totalInvestment = proposals.reduce((sum, p) => sum + parseInvestment(p.investment), 0);
  const leadsWithProposals = new Set(proposals.filter((p) => p.lead_id).map((p) => p.lead_id));

  const criticalCount = leads.filter((l) =>
    getUrgencyLevel(l.kanban_stage, l.stage_updated_at || null, l.last_activity_at || null) === "critical"
  ).length;

  return (
    <div className="flex flex-col min-w-[260px] max-w-[280px] shrink-0">
      {/* Header */}
      <div
        className="px-3 py-2.5 rounded-t-xl bg-white"
        style={{
          borderTop: `3px solid ${stage.color}`,
          border: '1px solid hsl(var(--color-border))',
          borderTopColor: stage.color,
          borderTopWidth: 3,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[13px]" style={{ color: 'hsl(var(--color-text-primary))' }}>
            {stage.label}
          </span>
          {SLA_CONFIG[stage.id] && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 cursor-help opacity-40 hover:opacity-70 shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {(() => {
                    const c = SLA_CONFIG[stage.id];
                    if (c.useHours) return `⚠️ Atenção: ${c.warningH}h · 🔴 Crítico: ${c.criticalH}h`;
                    return `⚠️ Atenção: ${c.warningD}d · 🔴 Crítico: ${c.criticalD}d`;
                  })()}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <span
            className="text-xs rounded-full px-2 py-0.5 font-medium"
            style={{ background: 'hsl(var(--color-bg-subtle))', color: 'hsl(var(--color-text-secondary))' }}
          >
            {leads.length}
          </span>
          {criticalCount > 0 && (
            <span
              className="text-xs font-medium rounded-full px-2 py-0.5 cursor-pointer"
              style={{ background: '#FDEDED', color: '#D32F2F' }}
            >
              {criticalCount} atrasado{criticalCount > 1 ? "s" : ""}
            </span>
          )}
          {totalInvestment > 0 && (
            <span className="text-xs font-bold ml-auto truncate" style={{ color: 'hsl(var(--color-urgent-ok))' }}>
              {formatBRL(totalInvestment)}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-3 space-y-3 rounded-b-xl min-h-[200px] overflow-y-auto max-h-[calc(100vh-240px)] transition-colors crm-scrollbar ${
          isOver ? "ring-2 ring-inset" : ""
        }`}
        style={{
          background: isOver ? 'hsl(var(--color-brand-light))' : '#F7F8FA',
          border: '1px solid hsl(var(--color-border))',
          borderTop: 'none',
          ...(isOver ? { ringColor: 'hsl(var(--color-brand) / 0.3)' } : {}),
        }}
      >
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            profiles={profiles}
            hasProposal={leadsWithProposals.has(lead.id)}
            followUpStatus={followUpsByLead[lead.id]}
            onOpenDrawer={onOpenDrawer}
            onQuickAction={onQuickAction}
          />
        ))}

        {leads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 opacity-50">
            <ArrowDown className="h-5 w-5 mb-1" style={{ color: '#BBB' }} aria-hidden="true" />
            <p className="text-[13px]" style={{ color: '#BBB' }}>
              Arraste leads aqui
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;

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
  onOpenDrawer: (lead: Lead) => void;
  onQuickAction: (lead: Lead, action: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ stage, leads, onOpenDrawer, onQuickAction }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

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

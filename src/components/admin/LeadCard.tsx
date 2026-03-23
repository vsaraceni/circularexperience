import { useDraggable } from "@dnd-kit/core";

import { Building2, User, FileText, Send, Linkedin, MessageSquare, Phone, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import UrgencyBadge from "./UrgencyBadge";
import type { Lead } from "./LeadList";

interface LeadCardProps {
  lead: Lead;
  onOpenDrawer: (lead: Lead) => void;
  onQuickAction: (lead: Lead, action: string) => void;
}

const STAGE_ACTIONS: Record<string, { icon: React.ReactNode; label: string; action: string }[]> = {
  novo: [
    { icon: <Send className="h-3 w-3" />, label: "Welcome", action: "send_welcome" },
    { icon: <FileText className="h-3 w-3" />, label: "Proposta", action: "generate_proposal" },
  ],
  boas_vindas: [
    { icon: <Linkedin className="h-3 w-3" />, label: "LinkedIn", action: "linkedin" },
    { icon: <MessageSquare className="h-3 w-3" />, label: "WhatsApp", action: "whatsapp" },
  ],
  em_contato: [
    { icon: <Phone className="h-3 w-3" />, label: "Agendar", action: "schedule_call" },
    { icon: <FileText className="h-3 w-3" />, label: "Proposta", action: "generate_proposal" },
  ],
  call_agendada: [
    { icon: <CheckCircle className="h-3 w-3" />, label: "Call Feita", action: "call_done" },
    { icon: <FileText className="h-3 w-3" />, label: "Proposta", action: "generate_proposal" },
  ],
  proposta: [
    { icon: <Send className="h-3 w-3" />, label: "Nutrir", action: "nurture" },
    { icon: <CheckCircle className="h-3 w-3" />, label: "Fechar", action: "close_won" },
  ],
  nutricao: [
    { icon: <FileText className="h-3 w-3" />, label: "Proposta", action: "generate_proposal" },
    { icon: <CheckCircle className="h-3 w-3" />, label: "Fechar", action: "close_won" },
  ],
};

const LeadCard: React.FC<LeadCardProps> = ({ lead, onOpenDrawer, onQuickAction }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
  });

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.3 : 1,
  };

  const actions = STAGE_ACTIONS[lead.kanban_stage] || [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors shadow-sm"
      onClick={(e) => {
        // Only open drawer if not dragging and not clicking a button
        if (!(e.target as HTMLElement).closest("button")) {
          onOpenDrawer(lead);
        }
      }}
    >
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <h4 className="font-semibold text-sm text-foreground truncate flex items-center gap-1">
          <Building2 className="h-3 w-3 shrink-0 text-muted-foreground" />
          {lead.company || "Sem empresa"}
        </h4>
        <UrgencyBadge lastActivityAt={lead.last_activity_at || null} />
      </div>

      <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mb-2">
        <User className="h-3 w-3 shrink-0" />
        {lead.name}
      </p>

      {actions.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {actions.map((a) => (
            <Button
              key={a.action}
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[10px] gap-1"
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction(lead, a.action);
              }}
            >
              {a.icon}
              {a.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeadCard;

import { useDraggable } from "@dnd-kit/core";
import { differenceInDays } from "date-fns";

import { Building2, User, FileText, Send, Linkedin, Copy, CalendarPlus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import UrgencyBadge from "./UrgencyBadge";
import type { Lead } from "./LeadList";

interface Profile {
  id: string;
  full_name: string | null;
}

interface LeadCardProps {
  lead: Lead;
  profiles?: Profile[];
  onOpenDrawer: (lead: Lead) => void;
  onQuickAction: (lead: Lead, action: string) => void;
}

const TOOLTIP_MAP: Record<string, string> = {
  send_welcome: "Enviar e-mail de boas-vindas",
  generate_proposal: "Criar proposta comercial",
  linkedin: "Buscar no LinkedIn",
  copy_whatsapp: "Copiar telefone para WhatsApp",
  schedule_call: "Abrir Google Agenda para agendar call",
  call_done: "Registrar call realizada",
  nurture: "Mover para nutrição",
  close_won: "Marcar como fechado",
};

const getStageActions = (lead: Lead): { icon: React.ReactNode; label: string; action: string; disabled?: boolean }[] => {
  const base: Record<string, { icon: React.ReactNode; label: string; action: string; disabled?: boolean }[]> = {
    novo: [
      {
        icon: lead.welcome_sent ? <CheckCircle className="h-3 w-3" /> : <Send className="h-3 w-3" />,
        label: lead.welcome_sent ? "Enviado ✓" : "Welcome",
        action: "send_welcome",
        disabled: lead.welcome_sent,
      },
      { icon: <FileText className="h-3 w-3" />, label: "Elab. Proposta", action: "generate_proposal" },
    ],
    boas_vindas: [
      { icon: <Linkedin className="h-3 w-3" />, label: "LinkedIn", action: "linkedin" },
      { icon: <Copy className="h-3 w-3" />, label: "Copiar Zap", action: "copy_whatsapp" },
    ],
    em_contato: [
      { icon: <CalendarPlus className="h-3 w-3" />, label: "Agendar Call", action: "schedule_call" },
      { icon: <FileText className="h-3 w-3" />, label: "Elab. Proposta", action: "generate_proposal" },
    ],
    call_agendada: [
      { icon: <CheckCircle className="h-3 w-3" />, label: "Call Feita", action: "call_done" },
      { icon: <FileText className="h-3 w-3" />, label: "Elab. Proposta", action: "generate_proposal" },
    ],
    proposta: [
      { icon: <Send className="h-3 w-3" />, label: "Nutrir", action: "nurture" },
      { icon: <CheckCircle className="h-3 w-3" />, label: "Fechar", action: "close_won" },
    ],
    nutricao: [
      { icon: <FileText className="h-3 w-3" />, label: "Elab. Proposta", action: "generate_proposal" },
      { icon: <CheckCircle className="h-3 w-3" />, label: "Fechar", action: "close_won" },
    ],
  };
  return base[lead.kanban_stage] || [];
};

function getUrgencyClasses(lastActivityAt: string | null): string {
  if (!lastActivityAt) return "bg-card border-border";
  const days = differenceInDays(new Date(), new Date(lastActivityAt));
  if (days <= 2) return "bg-emerald-500/5 border-emerald-500/20";
  if (days <= 5) return "bg-amber-500/5 border-amber-500/20";
  return "bg-red-500/5 border-red-500/20";
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, profiles = [], onOpenDrawer, onQuickAction }) => {
  const ownerProfile = profiles.find((p) => p.id === lead.assigned_to);
  const ownerInitials = ownerProfile?.full_name
    ? ownerProfile.full_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : null;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
  });

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.3 : 1,
  };

  const actions = getStageActions(lead);
  const urgencyClasses = getUrgencyClasses(lead.last_activity_at || null);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${urgencyClasses} border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors shadow-sm`}
      onClick={(e) => {
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
            <Tooltip key={a.action}>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={a.disabled}
                  className={`h-6 px-2 text-[10px] gap-1 ${a.disabled ? "opacity-50" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!a.disabled) onQuickAction(lead, a.action);
                  }}
                >
                  {a.icon}
                  {a.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{TOOLTIP_MAP[a.action] || a.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeadCard;

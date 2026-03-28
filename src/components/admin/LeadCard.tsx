import { useDraggable } from "@dnd-kit/core";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Building2, User, FileText, Send, Linkedin, Copy, CalendarPlus, CheckCircle, X, MessageSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import UrgencyBadge, { getUrgencyLevel } from "./UrgencyBadge";
import type { Lead } from "./LeadList";

interface Profile {
  id: string;
  full_name: string | null;
}

interface LeadCardProps {
  lead: Lead;
  profiles?: Profile[];
  hasProposal?: boolean;
  onOpenDrawer: (lead: Lead) => void;
  onQuickAction: (lead: Lead, action: string) => void;
}

const TOOLTIP_MAP: Record<string, string> = {
  send_welcome: "Enviar e-mail de boas-vindas",
  linkedin: "Buscar no LinkedIn",
  copy_whatsapp: "Copiar telefone para WhatsApp",
  schedule_call: "Agendar call e mover para Call Agendada",
  call_done: "Registrar call realizada e mover para Proposta",
  generate_proposal: "Criar proposta comercial",
  register_submission: "Registrar envio da proposta",
  register_contact: "Registrar contato realizado",
  close_won: "Fechar lead com sucesso",
};

const LOST_STAGES = new Set(["em_contato", "call_agendada", "proposta", "nutricao"]);

const getStageActions = (lead: Lead, hasProposal: boolean): { icon: React.ReactNode; label: string; action: string; disabled?: boolean }[] => {
  switch (lead.kanban_stage) {
    case "novo":
      return [
        {
          icon: lead.welcome_sent ? <CheckCircle className="h-3 w-3" /> : <Send className="h-3 w-3" />,
          label: lead.welcome_sent ? "Enviado ✓" : "Enviar Boas-Vindas",
          action: "send_welcome",
          disabled: lead.welcome_sent,
        },
      ];
    case "boas_vindas":
      return [
        { icon: <Linkedin className="h-3 w-3" />, label: "LinkedIn", action: "linkedin" },
        { icon: <Copy className="h-3 w-3" />, label: "Copiar Zap", action: "copy_whatsapp" },
      ];
    case "em_contato":
      return [
        { icon: <CalendarPlus className="h-3 w-3" />, label: "Agendar Call", action: "schedule_call" },
      ];
    case "call_agendada":
      return [
        { icon: <CheckCircle className="h-3 w-3" />, label: "Call Realizada", action: "call_done" },
      ];
    case "proposta": {
      const actions: { icon: React.ReactNode; label: string; action: string; disabled?: boolean }[] = [
        { icon: <FileText className="h-3 w-3" />, label: "Elab. Proposta", action: "generate_proposal" },
      ];
      if (hasProposal) {
        actions.push({ icon: <Send className="h-3 w-3" />, label: "Registrar Envio", action: "register_submission" });
      }
      return actions;
    }
    case "nutricao":
      return [
        { icon: <MessageSquare className="h-3 w-3" />, label: "Registrar Contato", action: "register_contact" },
        { icon: <CheckCircle className="h-3 w-3" />, label: "Fechar", action: "close_won" },
      ];
    default:
      return [];
  }
};

function getNextActionLabel(lead: Lead, hasProposal: boolean): string | null {
  switch (lead.kanban_stage) {
    case "novo": return "Enviar boas-vindas";
    case "boas_vindas": return "LinkedIn + WhatsApp";
    case "em_contato": return "Qualificar e agendar call";
    case "call_agendada": return "Aguardando call";
    case "proposta": return hasProposal ? "Registrar envio" : "Elaborar proposta";
    case "nutricao": {
      const level = getUrgencyLevel(lead.kanban_stage, lead.stage_updated_at || null, lead.last_activity_at || null);
      return level === "critical" || level === "warning" ? "Follow-up" : "Aguardando retorno";
    }
    default: return null;
  }
}

function getUrgencyBgClasses(level: "normal" | "warning" | "critical"): string {
  switch (level) {
    case "warning": return "bg-[#FFF8E1] dark:bg-amber-900/20 border-amber-300/40 dark:border-amber-500/30";
    case "critical": return "bg-[#FFEBEE] dark:bg-red-900/20 border-red-300/40 dark:border-red-500/30";
    default: return "bg-card border-border";
  }
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, profiles = [], hasProposal = false, onOpenDrawer, onQuickAction }) => {
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

  const actions = getStageActions(lead, hasProposal);
  const urgencyLevel = getUrgencyLevel(lead.kanban_stage, lead.stage_updated_at || null, lead.last_activity_at || null);
  const urgencyClasses = getUrgencyBgClasses(urgencyLevel);
  const showLostIcon = LOST_STAGES.has(lead.kanban_stage);
  const nextAction = getNextActionLabel(lead, hasProposal);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${urgencyClasses} border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors shadow-sm relative`}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("button")) {
          onOpenDrawer(lead);
        }
      }}
    >
      {showLostIcon && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-1 right-1 h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction(lead, "mark_lost");
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Marcar como perdido</TooltipContent>
        </Tooltip>
      )}

      <div className="flex items-start justify-between gap-1 mb-1.5">
        <h4 className="font-semibold text-sm text-foreground truncate flex items-center gap-1">
          <Building2 className="h-3 w-3 shrink-0 text-muted-foreground" />
          {lead.company || "Sem empresa"}
        </h4>
        <UrgencyBadge
          stage={lead.kanban_stage}
          stageUpdatedAt={lead.stage_updated_at || null}
          lastActivityAt={lead.last_activity_at || null}
        />
      </div>

      {lead.kanban_stage === "fechado" && lead.closed_at && (
        <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Fechado em {format(new Date(lead.closed_at), "dd MMM yyyy", { locale: ptBR })}
        </p>
      )}

      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
          <User className="h-3 w-3 shrink-0" />
          {lead.name}
        </p>
        <div className="flex items-center gap-1">
          {ownerInitials && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-5 w-5 text-[9px]">
                  <AvatarFallback className="bg-primary/10 text-primary text-[9px]">
                    {ownerInitials}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>{ownerProfile?.full_name}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

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

      {nextAction && (
        <div className="mt-2">
          <Badge variant="secondary" className="text-[10px] px-2 py-0 font-normal">
            {nextAction}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default LeadCard;

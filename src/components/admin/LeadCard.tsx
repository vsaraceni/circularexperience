import { useDraggable } from "@dnd-kit/core";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Building2, User, FileText, Send, Linkedin, Copy, CalendarPlus, CheckCircle, X, MessageSquare, Calendar, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  followUpStatus?: { hasToday: boolean; hasOverdue: boolean; hasFuture?: boolean };
  onOpenDrawer: (lead: Lead) => void;
  onQuickAction: (lead: Lead, action: string) => void;
}

const TOOLTIP_MAP: Record<string, string> = {
  send_welcome: "Enviar e-mail de boas-vindas",
  linkedin: "Buscar no LinkedIn",
  copy_whatsapp: "Copiar telefone para WhatsApp",
  move_to_contact: "Lead retornou contato — mover para Em Contato",
  schedule_call: "Agendar call e mover para Call Agendada",
  call_done: "Registrar call realizada e mover para Proposta",
  generate_proposal: "Criar proposta comercial",
  register_submission: "Registrar envio da proposta",
  register_contact: "Registrar contato realizado",
  close_won: "Fechar lead com sucesso",
};

const LOST_STAGES = new Set(["boas_vindas", "em_contato", "call_agendada", "proposta", "nutricao"]);

const getStageActions = (lead: Lead, hasProposal: boolean): { icon: React.ReactNode; label: string; action: string; disabled?: boolean; primary?: boolean }[] => {
  switch (lead.kanban_stage) {
    case "novo":
      return [
        {
          icon: lead.welcome_sent ? <CheckCircle className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />,
          label: lead.welcome_sent ? "Enviado ✓" : "Enviar Boas-Vindas",
          action: "send_welcome",
          disabled: lead.welcome_sent,
          primary: !lead.welcome_sent,
        },
      ];
    case "boas_vindas":
      return [
        { icon: <Linkedin className="h-3.5 w-3.5" />, label: "LinkedIn", action: "linkedin", primary: true },
        { icon: <Copy className="h-3.5 w-3.5" />, label: "Copiar Zap", action: "copy_whatsapp" },
        { icon: <CheckCircle className="h-3.5 w-3.5" />, label: "Em Contato", action: "move_to_contact" },
      ];
    case "em_contato":
      return [
        { icon: <CalendarPlus className="h-3.5 w-3.5" />, label: "Agendar Call", action: "schedule_call", primary: true },
      ];
    case "call_agendada":
      return [
        { icon: <CheckCircle className="h-3.5 w-3.5" />, label: "Call Realizada", action: "call_done", primary: true },
      ];
    case "proposta": {
      const actions: { icon: React.ReactNode; label: string; action: string; disabled?: boolean; primary?: boolean }[] = [
        { icon: <FileText className="h-3.5 w-3.5" />, label: "Elab. Proposta", action: "generate_proposal", primary: true },
      ];
      if (hasProposal) {
        actions.push({ icon: <Send className="h-3.5 w-3.5" />, label: "Proposta Enviada", action: "register_submission" });
      }
      return actions;
    }
    case "nutricao":
      return [
        { icon: <MessageSquare className="h-3.5 w-3.5" />, label: "Registrar Contato", action: "register_contact", primary: true },
        { icon: <CheckCircle className="h-3.5 w-3.5" />, label: "Fechar", action: "close_won" },
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

const LeadCard: React.FC<LeadCardProps> = ({ lead, profiles = [], hasProposal = false, followUpStatus, onOpenDrawer, onQuickAction }) => {
  const ownerProfile = profiles.find((p) => p.id === lead.assigned_to);
  const ownerInitials = ownerProfile?.full_name
    ? ownerProfile.full_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : null;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
  });

  const hasPendingFollowUp = followUpStatus ? (followUpStatus.hasToday || !!followUpStatus.hasFuture) && !followUpStatus.hasOverdue : false;
  const urgencyLevel = getUrgencyLevel(lead.kanban_stage, lead.stage_updated_at || null, lead.last_activity_at || null, hasPendingFollowUp);
  const isCritical = urgencyLevel === "critical";
  const showLostIcon = LOST_STAGES.has(lead.kanban_stage);
  const nextAction = getNextActionLabel(lead, hasProposal);
  const actions = getStageActions(lead, hasProposal);

  const borderLeftColor = urgencyLevel === "critical" ? '#D32F2F' : urgencyLevel === "warning" ? '#F4A736' : '#66BB6A';
  const noSlaStages = new Set(["fechado", "perdido"]);
  const showBorder = !noSlaStages.has(lead.kanban_stage);

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.3 : 1,
    boxShadow: isDragging ? 'var(--shadow-card-drag)' : 'var(--shadow-card-rest)',
    transform: isDragging ? 'rotate(2deg)' : undefined,
    borderLeft: showBorder ? `3px solid ${borderLeftColor}` : undefined,
    background: isCritical ? '#FFFAFA' : 'white',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-[10px] p-3 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.14)] relative group"
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
              className="absolute top-1.5 right-1.5 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'hsl(var(--color-text-muted))' }}
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction(lead, "mark_lost");
              }}
              aria-label="Marcar como perdido"
            >
              <X className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Marcar como perdido</TooltipContent>
        </Tooltip>
      )}

      {/* Row 1: Company + Urgency Badge */}
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <h4 className="font-semibold text-[14px] truncate flex items-center gap-1" style={{ color: 'hsl(var(--color-text-primary))' }}>
          <Building2 className="h-3.5 w-3.5 shrink-0" style={{ color: 'hsl(var(--color-text-muted))' }} aria-hidden="true" />
          {lead.company || "Sem empresa"}
        </h4>
        <div className="flex items-center gap-1 shrink-0">
          <UrgencyBadge
            stage={lead.kanban_stage}
            stageUpdatedAt={lead.stage_updated_at || null}
            lastActivityAt={lead.last_activity_at || null}
            hasPendingFollowUp={hasPendingFollowUp}
          />
          {followUpStatus?.hasOverdue && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: '#FDEDED', color: '#D32F2F' }}>
                  <CalendarClock className="h-3 w-3" /> Atrasado
                </span>
              </TooltipTrigger>
              <TooltipContent>Follow-up atrasado</TooltipContent>
            </Tooltip>
          )}
          {followUpStatus?.hasToday && !followUpStatus?.hasOverdue && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: '#FFFDE7', color: '#F9A825' }}>
                  <CalendarClock className="h-3 w-3" /> Hoje
                </span>
              </TooltipTrigger>
              <TooltipContent>Follow-up agendado para hoje</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {lead.kanban_stage === "fechado" && lead.closed_at && (
        <p className="text-[10px] mb-1 flex items-center gap-1" style={{ color: 'hsl(var(--color-text-muted))' }}>
          <Calendar className="h-3 w-3" aria-hidden="true" />
          Fechado em {format(new Date(lead.closed_at), "dd MMM yyyy", { locale: ptBR })}
        </p>
      )}

      {/* Row 2: Contact + Owner Avatar */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[13px] truncate flex items-center gap-1" style={{ color: 'hsl(var(--color-text-secondary))' }}>
          <User className="h-3 w-3 shrink-0" aria-hidden="true" />
          {lead.name}
        </p>
        {ownerInitials && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-7 w-7" aria-label={`Responsável: ${ownerProfile?.full_name}`}>
                <AvatarFallback
                  className="text-[11px] font-semibold"
                  style={{ background: 'hsl(var(--color-brand-light))', color: 'hsl(var(--color-brand))' }}
                >
                  {ownerInitials}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>Responsável: {ownerProfile?.full_name}</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Divider */}
      <div className="border-t mb-2" style={{ borderColor: '#F0F0F0' }} />

      {/* Next action pill */}
      {nextAction && (
        <div className="mb-2">
          <span
            className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full"
            style={{ background: 'hsl(var(--color-bg-subtle))', color: 'hsl(var(--color-text-secondary))' }}
          >
            {nextAction}
          </span>
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {actions.map((a) => (
            <Tooltip key={a.action}>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={a.disabled}
                  className={`h-[34px] min-h-[34px] px-2.5 text-[11px] gap-1 rounded-md transition-all ${
                    a.disabled ? "opacity-40" : ""
                  }`}
                  style={{
                    color: a.primary && !a.disabled ? 'hsl(var(--color-brand))' : 'hsl(var(--color-text-muted))',
                    fontWeight: a.primary ? 600 : 400,
                  }}
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

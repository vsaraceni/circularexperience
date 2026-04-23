import { Badge } from "@/components/ui/badge";
import { Building2, User, Briefcase, Target, DollarSign } from "lucide-react";
import UrgencyBadge from "./UrgencyBadge";
import HeatDots from "./HeatDots";
import type { Lead } from "./LeadList";

const STAGE_LABELS: Record<string, string> = {
  novo: "Novo",
  boas_vindas: "Boas-Vindas",
  em_contato: "Em Contato",
  call_agendada: "Call Agendada",
  proposta: "Proposta",
  nutricao: "Nutrição",
  fechado: "Fechado",
  perdido: "Perdido",
};

const STAGE_COLORS: Record<string, string> = {
  novo: "#9E9E9E",
  boas_vindas: "#1976D2",
  em_contato: "#1976D2",
  call_agendada: "#6A1B4D",
  proposta: "#388E3C",
  nutricao: "#E65100",
};

const COLABORADORES_LABELS: Record<string, string> = {
  "1_a_10": "1-10",
  "11_a_50": "11-50",
  "51_a_100": "51-100",
  "até_100": "≤100",
  "101_a_500": "101-500",
  "501_a_2000": "501-2k",
  "mais_de_2000": "2k+",
  "acima_de_2000": "2k+",
};

interface PriorityCardProps {
  lead: Lead;
  nextFollowUp?: { due_date: string } | null;
  onClick: (lead: Lead) => void;
}

const PriorityCard: React.FC<PriorityCardProps> = ({ lead, nextFollowUp, onClick }) => {
  const stageColor = STAGE_COLORS[lead.kanban_stage] || "#9E9E9E";
  const porteLabel = lead.colaboradores ? COLABORADORES_LABELS[lead.colaboradores] || lead.colaboradores.replace(/_/g, " ") : null;

  return (
    <button
      onClick={() => onClick(lead)}
      className="w-full text-left rounded-xl border p-3 flex items-center gap-3 transition-all hover:shadow-md group"
      style={{
        borderColor: 'hsl(var(--color-border))',
        background: 'hsl(var(--background))',
        borderLeftWidth: 4,
        borderLeftColor: stageColor,
      }}
    >
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold text-sm truncate" style={{ color: 'hsl(var(--color-text-primary))' }}>
            {lead.company || "Sem empresa"}
          </h4>
          <Badge
            variant="outline"
            className="text-[10px] h-5 px-1.5 shrink-0"
            style={{ borderColor: stageColor, color: stageColor }}
          >
            {STAGE_LABELS[lead.kanban_stage] || lead.kanban_stage}
          </Badge>
          <UrgencyBadge
            stage={lead.kanban_stage}
            stageUpdatedAt={lead.stage_updated_at || null}
            lastActivityAt={lead.last_activity_at || null}
            nextFollowUp={nextFollowUp ?? null}
          />
        </div>

        <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: 'hsl(var(--color-text-secondary))' }}>
          <span className="flex items-center gap-1 truncate">
            <User className="h-3 w-3 shrink-0" /> {lead.name}
          </span>
          {lead.cargo && (
            <span className="flex items-center gap-1 truncate">
              <Briefcase className="h-3 w-3 shrink-0" /> {lead.cargo.replace(/_/g, " ")}
            </span>
          )}
          {porteLabel && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3 shrink-0" /> {porteLabel}
            </span>
          )}
          {lead.lead_heat != null && lead.lead_heat > 0 && (
            <span className="flex items-center gap-1">
              <HeatDots value={lead.lead_heat} size="sm" />
            </span>
          )}
        </div>

        {((lead as any).proxima_acao || (lead as any).valor_proposta) && (
          <div className="flex items-center gap-3 text-xs flex-wrap">
            {(lead as any).proxima_acao && (
              <span className="italic truncate max-w-[260px]" style={{ color: 'hsl(var(--color-text-muted))' }}>
                <Target className="h-3 w-3 inline mr-0.5" />
                {(lead as any).proxima_acao}
              </span>
            )}
            {(lead as any).valor_proposta && (
              <span className="font-medium" style={{ color: 'hsl(var(--color-brand))' }}>
                <DollarSign className="h-3 w-3 inline" />
                {Number((lead as any).valor_proposta).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs" style={{ color: 'hsl(var(--color-text-muted))' }}>
        Abrir →
      </div>
    </button>
  );
};

export default PriorityCard;

import { useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, Users, Calendar, FileSearch, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { getUrgencyLevel } from "./UrgencyBadge";
import { isToday, isTomorrow } from "date-fns";
import type { Lead } from "./LeadList";

interface Mission {
  id: string;
  label: string;
  count: number;
  resolved: boolean;
  color: string;
  icon: React.ReactNode;
  stageId: string;
}

interface MissionsBannerProps {
  leads: Lead[];
  userId: string;
  profiles?: { id: string; full_name: string | null }[];
  onScrollToStage?: (stageId: string) => void;
  onOpenLead?: (lead: Lead) => void;
}

const MissionsBanner: React.FC<MissionsBannerProps> = ({
  leads, userId, profiles = [], onScrollToStage, onOpenLead,
}) => {
  const [showTeam, setShowTeam] = useState(false);

  const activeLeads = useMemo(
    () => leads.filter((l) => l.kanban_stage !== "perdido" && l.kanban_stage !== "fechado"),
    [leads]
  );

  const missions: Mission[] = useMemo(() => {
    // 1 — Leads novos sem ação (>4h ou sem responsável)
    const novos = activeLeads.filter(
      (l) => l.kanban_stage === "novo"
    );
    const novosCount = novos.length;

    // 2 — Follow-up Boas-Vindas (SLA warning ou critical)
    const boasVindas = activeLeads.filter(
      (l) =>
        l.kanban_stage === "boas_vindas" &&
        getUrgencyLevel(l.kanban_stage, l.stage_updated_at || null, l.last_activity_at || null) !== "normal"
    );

    // 3 — Aguardando agendamento
    const emContato = activeLeads.filter(
      (l) => l.kanban_stage === "em_contato"
    );

    // 4 — Calls próximas (hoje ou amanhã)
    const callsProximas = activeLeads.filter((l) => {
      if (l.kanban_stage !== "call_agendada" || !(l as any).call_date) return false;
      const d = new Date((l as any).call_date);
      return isToday(d) || isTomorrow(d);
    });

    // 5 — Briefings incompletos
    const briefingsIncompletos = activeLeads.filter(
      (l) =>
        l.kanban_stage === "call_agendada" &&
        (!(l as any).briefing_notes || (l as any).briefing_notes.trim() === "")
    );

    return [
      {
        id: "novos",
        label: "Leads novos",
        count: novosCount,
        resolved: novosCount === 0,
        color: novosCount === 0 ? "#2FB2C0" : novosCount >= 3 ? "#EB626D" : "#F4A736",
        icon: <Inbox className="h-4 w-4" />,
        stageId: "novo",
      },
      {
        id: "boas_vindas",
        label: "Follow-up pendente",
        count: boasVindas.length,
        resolved: boasVindas.length === 0,
        color: boasVindas.length === 0 ? "#2FB2C0" : boasVindas.length >= 3 ? "#EB626D" : "#F4A736",
        icon: <AlertTriangle className="h-4 w-4" />,
        stageId: "boas_vindas",
      },
      {
        id: "em_contato",
        label: "Sem agendamento",
        count: emContato.length,
        resolved: emContato.length === 0,
        color: emContato.length === 0 ? "#2FB2C0" : emContato.length >= 3 ? "#EB626D" : "#F4A736",
        icon: <Calendar className="h-4 w-4" />,
        stageId: "em_contato",
      },
      {
        id: "calls",
        label: "Calls próximas",
        count: callsProximas.length,
        resolved: callsProximas.length === 0,
        color: callsProximas.length === 0 ? "#2FB2C0" : "#F4A736",
        icon: <Calendar className="h-4 w-4" />,
        stageId: "call_agendada",
      },
      {
        id: "briefings",
        label: "Briefings pendentes",
        count: briefingsIncompletos.length,
        resolved: briefingsIncompletos.length === 0,
        color: briefingsIncompletos.length === 0 ? "#2FB2C0" : briefingsIncompletos.length >= 3 ? "#EB626D" : "#F4A736",
        icon: <FileSearch className="h-4 w-4" />,
        stageId: "call_agendada",
      },
    ];
  }, [activeLeads]);

  const resolvedCount = missions.filter((m) => m.resolved).length;
  const allResolved = resolvedCount === missions.length;
  const progressPercent = (resolvedCount / missions.length) * 100;

  const handleMissionClick = (mission: Mission) => {
    if (mission.id === "briefings" && onOpenLead) {
      const first = activeLeads.find(
        (l) =>
          l.kanban_stage === "call_agendada" &&
          (!(l as any).briefing_notes || (l as any).briefing_notes.trim() === "")
      );
      if (first) {
        onOpenLead(first);
        return;
      }
    }
    onScrollToStage?.(mission.stageId);
  };

  // Team view data
  const teamData = useMemo(() => {
    if (!profiles.length) return [];
    return profiles.map((p) => {
      const userLeads = activeLeads.filter((l) => l.assigned_to === p.id);
      return {
        name: p.full_name || "Sem nome",
        novos: userLeads.filter((l) => l.kanban_stage === "novo").length,
        boasVindas: userLeads.filter(
          (l) =>
            l.kanban_stage === "boas_vindas" &&
            getUrgencyLevel(l.kanban_stage, l.stage_updated_at || null, l.last_activity_at || null) !== "normal"
        ).length,
        emContato: userLeads.filter((l) => l.kanban_stage === "em_contato").length,
        calls: userLeads.filter((l) => {
          if (l.kanban_stage !== "call_agendada" || !(l as any).call_date) return false;
          const d = new Date((l as any).call_date);
          return isToday(d) || isTomorrow(d);
        }).length,
        briefings: userLeads.filter(
          (l) => l.kanban_stage === "call_agendada" && (!(l as any).briefing_notes || (l as any).briefing_notes.trim() === "")
        ).length,
      };
    });
  }, [profiles, activeLeads]);

  const cellColor = (n: number) =>
    n === 0 ? "#E8F5E9" : n <= 2 ? "#FFFDE7" : "#FDEDED";
  const cellTextColor = (n: number) =>
    n === 0 ? "#388E3C" : n <= 2 ? "#F9A825" : "#D32F2F";

  return (
    <div
      className={`rounded-xl border p-3 mb-4 transition-all ${allResolved ? "opacity-70" : ""}`}
      style={{ borderColor: "hsl(var(--color-border))", background: "white" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[13px] font-semibold" style={{ color: "hsl(var(--color-text-primary))" }}>
          Missões do Dia
        </span>
        {allResolved && (
          <Badge
            className="text-[10px] h-5 px-2 gap-1"
            style={{ background: "#E8F5E9", color: "#388E3C", border: "none" }}
          >
            <CheckCircle2 className="h-3 w-3" /> Pipeline em dia
          </Badge>
        )}
        <span className="text-[11px] ml-auto" style={{ color: "hsl(var(--color-text-muted))" }}>
          {resolvedCount}/{missions.length}
        </span>
        {profiles.length > 1 && (
          <Popover open={showTeam} onOpenChange={setShowTeam}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] gap-1 px-2"
                style={{ color: "hsl(var(--color-text-secondary))" }}
              >
                <Users className="h-3 w-3" /> Ver time
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="end">
              <p className="text-xs font-semibold mb-2" style={{ color: "hsl(var(--color-text-primary))" }}>
                Missões por usuário
              </p>
              <table className="text-[11px]">
                <thead>
                  <tr>
                    <th className="text-left pr-3 pb-1 font-medium" style={{ color: "hsl(var(--color-text-muted))" }}>Usuário</th>
                    <th className="px-2 pb-1 font-medium" style={{ color: "hsl(var(--color-text-muted))" }}>Novos</th>
                    <th className="px-2 pb-1 font-medium" style={{ color: "hsl(var(--color-text-muted))" }}>BV</th>
                    <th className="px-2 pb-1 font-medium" style={{ color: "hsl(var(--color-text-muted))" }}>Agend.</th>
                    <th className="px-2 pb-1 font-medium" style={{ color: "hsl(var(--color-text-muted))" }}>Calls</th>
                    <th className="px-2 pb-1 font-medium" style={{ color: "hsl(var(--color-text-muted))" }}>Brief.</th>
                  </tr>
                </thead>
                <tbody>
                  {teamData.map((row) => (
                    <tr key={row.name}>
                      <td className="pr-3 py-0.5 font-medium" style={{ color: "hsl(var(--color-text-primary))" }}>{row.name}</td>
                      {[row.novos, row.boasVindas, row.emContato, row.calls, row.briefings].map((n, i) => (
                        <td key={i} className="px-2 py-0.5 text-center rounded" style={{ background: cellColor(n), color: cellTextColor(n) }}>
                          {n}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Mission cards */}
      <div className="flex gap-2 flex-wrap">
        {missions.map((m) => (
          <button
            key={m.id}
            onClick={() => handleMissionClick(m)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all cursor-pointer hover:shadow-sm ${
              m.resolved ? "opacity-50" : ""
            }`}
            style={{
              borderColor: "hsl(var(--color-border))",
              borderLeftWidth: 3,
              borderLeftColor: m.color,
              background: "white",
              minWidth: 140,
            }}
          >
            {m.resolved ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#2FB2C0" }} />
            ) : (
              <span className="text-lg font-bold leading-none" style={{ color: m.color }}>
                {m.count}
              </span>
            )}
            <span className="text-[12px] leading-tight" style={{ color: "hsl(var(--color-text-secondary))" }}>
              {m.label}
            </span>
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--color-bg-subtle))" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%`, background: "#2FB2C0" }}
        />
      </div>
    </div>
  );
};

export default MissionsBanner;

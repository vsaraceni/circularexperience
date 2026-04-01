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
  followUpsByLead?: Record<string, { hasToday: boolean; hasOverdue: boolean; hasFuture?: boolean }>;
  onScrollToStage?: (stageId: string) => void;
  onOpenLead?: (lead: Lead) => void;
  inline?: boolean;
}

function hasPendingFU(fu?: { hasToday: boolean; hasOverdue: boolean; hasFuture?: boolean }): boolean {
  if (!fu) return false;
  return (fu.hasToday || !!fu.hasFuture) && !fu.hasOverdue;
}

const MissionsBanner: React.FC<MissionsBannerProps> = ({
  leads, userId, profiles = [], followUpsByLead = {}, onScrollToStage, onOpenLead, inline = false,
}) => {
  const [showTeam, setShowTeam] = useState(false);

  const activeLeads = useMemo(
    () => leads.filter((l) => l.kanban_stage !== "perdido" && l.kanban_stage !== "fechado"),
    [leads]
  );

  const missions: Mission[] = useMemo(() => {
    const novosCount = activeLeads.filter((l) => l.kanban_stage === "novo").length;

    // Follow-up pendente: only leads WITHOUT a pending (non-overdue) follow-up
    const boasVindas = activeLeads.filter(
      (l) =>
        l.kanban_stage === "boas_vindas" &&
        !hasPendingFU(followUpsByLead[l.id]) &&
        getUrgencyLevel(l.kanban_stage, l.stage_updated_at || null, l.last_activity_at || null) !== "normal"
    );

    const emContato = activeLeads.filter((l) => l.kanban_stage === "em_contato");

    const callsProximas = activeLeads.filter((l) => {
      if (l.kanban_stage !== "call_agendada" || !(l as any).call_date) return false;
      const d = new Date((l as any).call_date);
      return isToday(d) || isTomorrow(d);
    });

    const briefingsIncompletos = activeLeads.filter(
      (l) =>
        (l.kanban_stage === "call_agendada" || l.kanban_stage === "proposta") &&
        (!(l as any).briefing_notes || (l as any).briefing_notes.trim() === "")
    );

    return [
      {
        id: "novos", label: "Novos", count: novosCount, resolved: novosCount === 0,
        color: novosCount === 0 ? "#2FB2C0" : novosCount >= 3 ? "#EB626D" : "#F4A736",
        icon: <Inbox className="h-3.5 w-3.5" />, stageId: "novo",
      },
      {
        id: "boas_vindas", label: "Follow-up", count: boasVindas.length, resolved: boasVindas.length === 0,
        color: boasVindas.length === 0 ? "#2FB2C0" : boasVindas.length >= 3 ? "#EB626D" : "#F4A736",
        icon: <AlertTriangle className="h-3.5 w-3.5" />, stageId: "boas_vindas",
      },
      {
        id: "em_contato", label: "Agendamento", count: emContato.length, resolved: emContato.length === 0,
        color: emContato.length === 0 ? "#2FB2C0" : emContato.length >= 3 ? "#EB626D" : "#F4A736",
        icon: <Calendar className="h-3.5 w-3.5" />, stageId: "em_contato",
      },
      {
        id: "calls", label: "Calls", count: callsProximas.length, resolved: callsProximas.length === 0,
        color: callsProximas.length === 0 ? "#2FB2C0" : "#F4A736",
        icon: <Calendar className="h-3.5 w-3.5" />, stageId: "call_agendada",
      },
      {
        id: "briefings", label: "Briefing", count: briefingsIncompletos.length, resolved: briefingsIncompletos.length === 0,
        color: briefingsIncompletos.length === 0 ? "#2FB2C0" : briefingsIncompletos.length >= 3 ? "#EB626D" : "#F4A736",
        icon: <FileSearch className="h-3.5 w-3.5" />, stageId: "call_agendada",
      },
    ];
  }, [activeLeads, followUpsByLead]);

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
      if (first) { onOpenLead(first); return; }
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
            !hasPendingFU(followUpsByLead[l.id]) &&
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
  }, [profiles, activeLeads, followUpsByLead]);

  const cellColor = (n: number) =>
    n === 0 ? "#E8F5E9" : n <= 2 ? "#FFFDE7" : "#FDEDED";
  const cellTextColor = (n: number) =>
    n === 0 ? "#388E3C" : n <= 2 ? "#F9A825" : "#D32F2F";

  return (
    <div
      className="rounded-lg border p-2 mb-3 transition-all relative overflow-hidden"
      style={{ borderColor: "hsl(var(--color-border))", background: "white" }}
    >
      <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
        {/* Title */}
        <span className="text-[12px] font-semibold whitespace-nowrap flex items-center gap-1" style={{ color: "hsl(var(--color-text-primary))" }}>
          🎯 Missões
        </span>

        {allResolved ? (
          <Badge
            className="text-[10px] h-5 px-2 gap-1 whitespace-nowrap"
            style={{ background: "#E8F5E9", color: "#388E3C", border: "none" }}
          >
            <CheckCircle2 className="h-3 w-3" /> Pipeline em dia
          </Badge>
        ) : (
          <>
            {missions.map((m) => (
              <button
                key={m.id}
                onClick={() => handleMissionClick(m)}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer hover:opacity-80 ${
                  m.resolved ? "opacity-40" : ""
                }`}
                style={{
                  borderLeft: `2px solid ${m.color}`,
                  background: m.resolved ? "transparent" : undefined,
                  color: m.resolved ? "hsl(var(--color-text-muted))" : "hsl(var(--color-text-secondary))",
                }}
              >
                {m.resolved ? (
                  <CheckCircle2 className="h-3 w-3" style={{ color: "#2FB2C0" }} />
                ) : (
                  <span className="font-bold" style={{ color: m.color }}>{m.count}</span>
                )}
                {m.label}
              </button>
            ))}
          </>
        )}

        {/* Counter + Team */}
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <span className="text-[10px] font-medium" style={{ color: "hsl(var(--color-text-muted))" }}>
            {resolvedCount}/{missions.length}
          </span>
          {profiles.length > 1 && (
            <Popover open={showTeam} onOpenChange={setShowTeam}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[10px] gap-0.5 px-1.5"
                  style={{ color: "hsl(var(--color-text-secondary))" }}
                >
                  <Users className="h-3 w-3" />
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
                      <th className="px-2 pb-1 font-medium" style={{ color: "hsl(var(--color-text-muted))" }}>Follow-up</th>
                      <th className="px-2 pb-1 font-medium" style={{ color: "hsl(var(--color-text-muted))" }}>Agendamento</th>
                      <th className="px-2 pb-1 font-medium" style={{ color: "hsl(var(--color-text-muted))" }}>Calls</th>
                      <th className="px-2 pb-1 font-medium" style={{ color: "hsl(var(--color-text-muted))" }}>Briefing</th>
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
      </div>

      {/* Thin progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "hsl(var(--color-bg-subtle))" }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progressPercent}%`, background: "#2FB2C0" }}
        />
      </div>
    </div>
  );
};

export default MissionsBanner;

import { Badge } from "@/components/ui/badge";
import { differenceInHours, differenceInMinutes, differenceInDays } from "date-fns";

export type UrgencyLevel = "normal" | "warning" | "critical";

const SLA_CONFIG: Record<string, { warningH?: number; criticalH?: number; warningD?: number; criticalD?: number; useHours?: boolean }> = {
  novo: { warningH: 2, criticalH: 4, useHours: true },
  boas_vindas: { warningH: 2, criticalH: 6, useHours: true },
  em_contato: { warningD: 2, criticalD: 4 },
  call_agendada: { warningD: 5, criticalD: 10 },
  proposta: { warningD: 2, criticalD: 4 },
  nutricao: { warningD: 5, criticalD: 10 },
};

export function getUrgencyLevel(
  stage: string,
  stageUpdatedAt: string | null,
  lastActivityAt: string | null
): UrgencyLevel {
  if (stage === "fechado" || stage === "perdido") return "normal";

  const config = SLA_CONFIG[stage];
  if (!config) return "normal";

  const refDate = stage === "nutricao" ? (lastActivityAt || stageUpdatedAt) : stageUpdatedAt;
  if (!refDate) return "normal";

  const now = new Date();
  const ref = new Date(refDate);

  if (config.useHours) {
    const hours = differenceInHours(now, ref);
    if (hours >= (config.criticalH ?? Infinity)) return "critical";
    if (hours >= (config.warningH ?? Infinity)) return "warning";
    return "normal";
  }

  const days = differenceInDays(now, ref);
  if (days >= (config.criticalD ?? Infinity)) return "critical";
  if (days >= (config.warningD ?? Infinity)) return "warning";
  return "normal";
}

function formatElapsed(stage: string, stageUpdatedAt: string | null, lastActivityAt: string | null): string {
  const config = SLA_CONFIG[stage];
  if (!config) return "";

  const refDate = stage === "nutricao" ? (lastActivityAt || stageUpdatedAt) : stageUpdatedAt;
  if (!refDate) return "";

  const now = new Date();
  const ref = new Date(refDate);

  if (config.useHours) {
    const totalMin = differenceInMinutes(now, ref);
    if (totalMin >= 1440) return `${Math.floor(totalMin / 1440)}d`;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, "0") + "m" : ""}` : `${m}m`;
  }

  const days = differenceInDays(now, ref);
  return days < 1 ? "hoje" : `${days}d`;
}

interface UrgencyBadgeProps {
  stage: string;
  stageUpdatedAt: string | null;
  lastActivityAt: string | null;
}

const LEVEL_CLASSES: Record<UrgencyLevel, string> = {
  normal: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ stage, stageUpdatedAt, lastActivityAt }) => {
  if (stage === "fechado" || stage === "perdido") return null;

  const elapsed = formatElapsed(stage, stageUpdatedAt, lastActivityAt);
  if (!elapsed) return null;

  const level = getUrgencyLevel(stage, stageUpdatedAt, lastActivityAt);

  return (
    <Badge className={`${LEVEL_CLASSES[level]} text-[10px] px-1.5 py-0`}>
      {elapsed}
    </Badge>
  );
};

export default UrgencyBadge;

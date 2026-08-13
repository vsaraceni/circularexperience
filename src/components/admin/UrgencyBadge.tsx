import { differenceInHours, differenceInMinutes, differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarClock, AlarmClock, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import React from "react";

/**
 * Urgency model — single source of truth used in Drawer, Kanban card,
 * Priority list and Missions banner.
 *
 * Severity (most → least urgent):
 *   critical   🔴  follow-up overdue OR no follow-up & past stage critical
 *   today      🟡  follow-up due today
 *   warning    🟡  no follow-up & past stage warning (suffix "sem ação")
 *   scheduled  🟣  follow-up planned in the future (lead under control)
 *   normal     🟢  no follow-up & still inside stage time budget
 */
export type UrgencyLevel = "normal" | "scheduled" | "warning" | "today" | "critical";

export interface NextFollowUpInfo {
  due_date: string; // YYYY-MM-DD
}

export const SLA_CONFIG: Record<string, { warningH?: number; criticalH?: number; warningD?: number; criticalD?: number; useHours?: boolean }> = {
  novo: { warningH: 2, criticalH: 4, useHours: true },
  boas_vindas: { warningH: 2, criticalH: 6, useHours: true },
  em_contato: { warningD: 2, criticalD: 4 },
  call_agendada: { warningD: 5, criticalD: 10 },
  proposta: { warningD: 2, criticalD: 4 },
  nutricao: { warningD: 5, criticalD: 10 },
  tratativas: { warningD: 3, criticalD: 7 },
};

/**
 * Compute urgency.
 *
 * `followUp` may be:
 *   - `null` / `undefined` → no scheduled follow-up.
 *   - `boolean` (legacy) → true means "has a pending non-overdue follow-up";
 *     mapped to `scheduled` for backwards compat.
 *   - `{ due_date }` → exact next follow-up; classified as overdue / today / future.
 */
export function getUrgencyLevel(
  stage: string,
  stageUpdatedAt: string | null,
  lastActivityAt: string | null,
  followUp?: NextFollowUpInfo | boolean | null,
): UrgencyLevel {
  if (stage === "fechado" || stage === "perdido") return "normal";

  // Resolve follow-up bucket
  let fuBucket: "overdue" | "today" | "future" | "none" = "none";
  if (followUp && typeof followUp === "object" && followUp.due_date) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(followUp.due_date + "T00:00:00");
    if (due < today) fuBucket = "overdue";
    else if (due.getTime() === today.getTime()) fuBucket = "today";
    else fuBucket = "future";
  } else if (followUp === true) {
    fuBucket = "future"; // legacy boolean
  }

  if (fuBucket === "overdue") return "critical";
  if (fuBucket === "today") return "today";
  if (fuBucket === "future") return "scheduled";

  // No follow-up → fall back to time-based SLA per stage.
  const config = SLA_CONFIG[stage];
  if (!config) return "normal";

  const refDate = lastActivityAt || stageUpdatedAt;
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

function formatElapsed(stage: string, stageUpdatedAt: string | null, lastActivityAt: string | null, hasPendingFollowUp?: boolean): string {
  const config = SLA_CONFIG[stage];
  if (!config) return "";

  const refDate = lastActivityAt || stageUpdatedAt;
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
  /** Pending non-overdue follow-up if any. Pass `null` when none. */
  nextFollowUp?: NextFollowUpInfo | null;
  /** @deprecated use `nextFollowUp` — kept so legacy call sites still compile. */
  hasPendingFollowUp?: boolean;
}

export const LEVEL_STYLES: Record<UrgencyLevel, { bg: string; color: string; border: string; solid: string; icon: React.ReactNode; label: string }> = {
  normal:    { bg: "hsl(var(--status-ontime) / 0.08)",    color: "hsl(var(--status-ontime))",    border: "hsl(var(--status-ontime) / 0.28)",    solid: "hsl(var(--status-ontime))",    icon: <CheckCircle2 className="h-3 w-3" />,   label: "No prazo" },
  scheduled: { bg: "hsl(var(--status-scheduled) / 0.08)", color: "hsl(var(--status-scheduled))", border: "hsl(var(--status-scheduled) / 0.28)", solid: "hsl(var(--status-scheduled))", icon: <CalendarClock className="h-3 w-3" />, label: "Agendado" },
  today:     { bg: "hsl(var(--status-today) / 0.09)",     color: "hsl(var(--status-today))",     border: "hsl(var(--status-today) / 0.30)",     solid: "hsl(var(--status-today))",     icon: <AlarmClock className="h-3 w-3" />,    label: "Hoje" },
  warning:   { bg: "hsl(var(--status-warning) / 0.12)",   color: "hsl(45 96% 34%)",              border: "hsl(var(--status-warning) / 0.35)",   solid: "hsl(var(--status-warning))",   icon: <AlertTriangle className="h-3 w-3" />, label: "Atenção" },
  critical:  { bg: "hsl(var(--status-critical) / 0.08)",  color: "hsl(var(--status-critical))",  border: "hsl(var(--status-critical) / 0.28)",  solid: "hsl(var(--status-critical))",  icon: <AlertCircle className="h-3 w-3" />,   label: "Vencido" },
};

/**
 * Marcador de estado — losango sólido com halo suave.
 * Substitui a antiga barra lateral colorida.
 */
export const StatusMarker: React.FC<{ level: UrgencyLevel; title?: string; className?: string }> = ({ level, title, className }) => {
  const s = LEVEL_STYLES[level];
  return (
    <span
      role="img"
      aria-label={title || s.label}
      title={title || s.label}
      className={`inline-block shrink-0 ${className || ""}`}
      style={{
        width: 7,
        height: 7,
        background: s.solid,
        borderRadius: 2,
        transform: "rotate(45deg)",
        boxShadow: `0 0 0 3px ${s.bg}`,
      }}
    />
  );
};

/** Format the badge text given the urgency level + context. */
export function formatBadgeText(
  level: UrgencyLevel,
  stage: string,
  stageUpdatedAt: string | null,
  lastActivityAt: string | null,
  nextFollowUp?: NextFollowUpInfo | null,
): string {
  if (level === "today") return "hoje";
  if (level === "scheduled" && nextFollowUp?.due_date) {
    try {
      return format(new Date(nextFollowUp.due_date + "T00:00:00"), "dd/MM", { locale: ptBR });
    } catch { /* fall through */ }
  }
  if (level === "critical" && nextFollowUp?.due_date) {
    // Overdue follow-up: show how many days late.
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const due = new Date(nextFollowUp.due_date + "T00:00:00");
      const lateDays = differenceInDays(today, due);
      return lateDays > 0 ? `+${lateDays}d` : "hoje";
    } catch { /* fall through */ }
  }
  return formatElapsed(stage, stageUpdatedAt, lastActivityAt);
}

const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ stage, stageUpdatedAt, lastActivityAt, nextFollowUp, hasPendingFollowUp }) => {
  if (stage === "fechado" || stage === "perdido") return null;

  // Backwards-compat: legacy callers passing `hasPendingFollowUp={true}` had no
  // due_date — treat them as "future follow-up, date unknown".
  const fu: NextFollowUpInfo | null | undefined =
    nextFollowUp !== undefined ? nextFollowUp : hasPendingFollowUp ? ({ due_date: "" } as any) : null;

  const level = getUrgencyLevel(stage, stageUpdatedAt, lastActivityAt, fu);
  const text = formatBadgeText(level, stage, stageUpdatedAt, lastActivityAt, fu);
  const styles = LEVEL_STYLES[level];
  const label = level === "critical" ? "Atrasado" : styles.label;

  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.04em] px-1.5 py-[3px] rounded-[5px] whitespace-nowrap"
      style={{ background: styles.bg, color: styles.color, border: `1px solid ${styles.border}` }}
      title={text ? `${styles.label} · ${text}` : styles.label}
    >
      {styles.icon}
      {label}
      {text && <span className="opacity-70 font-medium normal-case tracking-normal">· {text}</span>}
    </span>
  );
};

export default UrgencyBadge;

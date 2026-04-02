import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SLA_CONFIG, getUrgencyLevel } from "@/components/admin/UrgencyBadge";
import { differenceInHours, differenceInDays, subDays } from "date-fns";

export interface DashboardLead {
  id: string;
  name: string;
  company: string | null;
  email: string;
  kanban_stage: string;
  status: string;
  origem: string;
  assigned_to: string | null;
  created_at: string | null;
  stage_updated_at: string | null;
  last_activity_at: string | null;
  welcome_sent: boolean;
  linkedin_added: boolean | null;
  whatsapp_sent: boolean | null;
  closed_at: string | null;
  lost_reason: string | null;
  call_date: string | null;
  briefing_notes: string | null;
}

export interface DashboardProfile {
  id: string;
  full_name: string | null;
  role_label: string | null;
  badge_initials: string | null;
}

export interface DashboardActivity {
  id: string;
  lead_id: string;
  activity_type: string;
  created_at: string | null;
  user_id: string | null;
}

export interface DashboardProposal {
  id: string;
  investment: string | null;
  lead_id: string | null;
  status: string;
}

export type AlertType = "sla_critical" | "no_activity" | "stale_proposal" | "call_no_briefing" | "overdue_followup" | "protocol_incomplete";

export interface DashboardAlert {
  type: AlertType;
  message: string;
  leadId: string;
  leadName: string;
  severity: "warning" | "critical";
}

const ACTIVE_STAGES = ["novo", "boas_vindas", "em_contato", "call_agendada", "proposta", "nutricao", "fechado"];

export function useStrategicDashboard() {
  const [leads, setLeads] = useState<DashboardLead[]>([]);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [profiles, setProfiles] = useState<DashboardProfile[]>([]);
  const [proposals, setProposals] = useState<DashboardProposal[]>([]);
  const [followUps, setFollowUps] = useState<{ lead_id: string; due_date: string; completed: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const sevenDaysAgo = subDays(new Date(), 7).toISOString();

    const [leadsRes, activitiesRes, profilesRes, proposalsRes, followUpsRes] = await Promise.all([
      supabase.from("leads").select("*").neq("status", "archived"),
      supabase.from("lead_activities").select("id, lead_id, activity_type, created_at, user_id").gte("created_at", sevenDaysAgo),
      supabase.from("profiles").select("id, full_name, role_label, badge_initials"),
      supabase.from("proposals").select("id, investment, lead_id, status"),
      supabase.from("lead_follow_ups").select("lead_id, due_date, completed").eq("completed", false),
    ]);

    if (leadsRes.data) setLeads(leadsRes.data as DashboardLead[]);
    if (activitiesRes.data) setActivities(activitiesRes.data as DashboardActivity[]);
    if (profilesRes.data) setProfiles(profilesRes.data as DashboardProfile[]);
    if (proposalsRes.data) setProposals(proposalsRes.data as DashboardProposal[]);
    if (followUpsRes.data) setFollowUps(followUpsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();

    const leadsChannel = supabase
      .channel("strategic-leads")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        fetchAll();
      })
      .subscribe();

    const activitiesChannel = supabase
      .channel("strategic-activities")
      .on("postgres_changes", { event: "*", schema: "public", table: "lead_activities" }, () => {
        fetchAll();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(activitiesChannel);
    };
  }, [fetchAll]);

  const activeLeads = useMemo(() => leads.filter((l) => l.status !== "lost"), [leads]);
  const lostLeads = useMemo(() => leads.filter((l) => l.status === "lost"), [leads]);

  // Pipeline counts per stage
  const pipelineCounts = useMemo(() => {
    const counts: Record<string, DashboardLead[]> = {};
    ACTIVE_STAGES.forEach((s) => (counts[s] = []));
    activeLeads.forEach((l) => {
      if (counts[l.kanban_stage]) counts[l.kanban_stage].push(l);
    });
    return counts;
  }, [activeLeads]);

  // Health Score: % of active leads within SLA
  const healthScore = useMemo(() => {
    const scoreable = activeLeads.filter((l) => l.kanban_stage !== "fechado" && l.kanban_stage !== "perdido");
    if (scoreable.length === 0) return 100;

    const pendingFollowUpLeadIds = new Set(followUps.map((f) => f.lead_id));
    const healthy = scoreable.filter((l) => {
      const level = getUrgencyLevel(l.kanban_stage, l.stage_updated_at, l.last_activity_at, pendingFollowUpLeadIds.has(l.id));
      return level === "normal";
    });
    return Math.round((healthy.length / scoreable.length) * 100);
  }, [activeLeads, followUps]);

  // Stage health: per-stage % within SLA
  const stageHealth = useMemo(() => {
    const pendingFollowUpLeadIds = new Set(followUps.map((f) => f.lead_id));
    const result: Record<string, { total: number; healthy: number; warning: number; critical: number }> = {};

    ACTIVE_STAGES.forEach((stage) => {
      const stageLeads = pipelineCounts[stage] || [];
      const stats = { total: stageLeads.length, healthy: 0, warning: 0, critical: 0 };
      stageLeads.forEach((l) => {
        const level = getUrgencyLevel(l.kanban_stage, l.stage_updated_at, l.last_activity_at, pendingFollowUpLeadIds.has(l.id));
        if (level === "normal") stats.healthy++;
        else if (level === "warning") stats.warning++;
        else stats.critical++;
      });
      result[stage] = stats;
    });

    return result;
  }, [pipelineCounts, followUps]);

  // Velocity: leads closed in last 7 days
  const velocity7d = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    return activeLeads.filter(
      (l) => l.kanban_stage === "fechado" && l.closed_at && new Date(l.closed_at) >= sevenDaysAgo
    ).length;
  }, [activeLeads]);

  // Activities today
  const activitiesToday = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return activities.filter((a) => a.created_at?.startsWith(today)).length;
  }, [activities]);

  // Pipeline total value
  const pipelineTotal = useMemo(() => {
    const openLeadIds = new Set(
      activeLeads.filter((l) => l.kanban_stage !== "fechado").map((l) => l.id)
    );
    return proposals
      .filter((p) => p.lead_id && openLeadIds.has(p.lead_id))
      .reduce((sum, p) => {
        if (!p.investment) return sum;
        const text = p.investment;
        // Handle patterns like "2x de R$ 28.000" → 56000
        const multiMatch = text.match(/(\d+)\s*x\s*(?:de\s*)?R?\$?\s*([\d.,]+)/i);
        if (multiMatch) {
          const multiplier = parseInt(multiMatch[1]);
          const val = parseFloat(multiMatch[2].replace(/\./g, "").replace(",", "."));
          return sum + (isNaN(val) ? 0 : val * multiplier);
        }
        const nums = text.match(/[\d.,]+/g);
        if (!nums) return sum;
        const val = parseFloat(nums[0].replace(/\./g, "").replace(",", "."));
        return sum + (isNaN(val) ? 0 : val);
      }, 0);
  }, [activeLeads, proposals]);

  // Alerts
  const alerts = useMemo(() => {
    const result: DashboardAlert[] = [];
    const now = new Date();
    const pendingFollowUpLeadIds = new Set(followUps.map((f) => f.lead_id));

    activeLeads.forEach((l) => {
      if (l.kanban_stage === "fechado") return;

      // 1. SLA critical
      const level = getUrgencyLevel(l.kanban_stage, l.stage_updated_at, l.last_activity_at, pendingFollowUpLeadIds.has(l.id));
      if (level === "critical") {
        result.push({
          type: "sla_critical",
          message: `SLA crítico em "${l.kanban_stage}"`,
          leadId: l.id,
          leadName: l.company || l.name,
          severity: "critical",
        });
      }

      // 2. Boas-vindas protocol incomplete
      if (l.kanban_stage === "boas_vindas" || l.kanban_stage === "em_contato") {
        const missing: string[] = [];
        if (!l.welcome_sent) missing.push("email");
        if (!l.linkedin_added) missing.push("LinkedIn");
        if (!l.whatsapp_sent) missing.push("WhatsApp");
        if (missing.length > 0) {
          result.push({
            type: "protocol_incomplete",
            message: `Protocolo BV incompleto: falta ${missing.join(", ")}`,
            leadId: l.id,
            leadName: l.company || l.name,
            severity: "warning",
          });
        }
      }

      // 3. Call agendada sem briefing
      if (l.kanban_stage === "call_agendada" && !l.briefing_notes) {
        result.push({
          type: "call_no_briefing",
          message: "Call agendada sem briefing",
          leadId: l.id,
          leadName: l.company || l.name,
          severity: "warning",
        });
      }

      // 4. Proposta/Nutrição sem atividade > 3 dias
      if ((l.kanban_stage === "proposta" || l.kanban_stage === "nutricao") && l.last_activity_at) {
        const daysSinceActivity = differenceInDays(now, new Date(l.last_activity_at));
        if (daysSinceActivity > 3) {
          result.push({
            type: "no_activity",
            message: `${daysSinceActivity}d sem atividade`,
            leadId: l.id,
            leadName: l.company || l.name,
            severity: daysSinceActivity > 5 ? "critical" : "warning",
          });
        }
      }
    });

    // 5. Overdue follow-ups
    followUps.forEach((fu) => {
      if (new Date(fu.due_date) < now) {
        const lead = activeLeads.find((l) => l.id === fu.lead_id);
        if (lead && lead.kanban_stage !== "fechado") {
          result.push({
            type: "overdue_followup",
            message: "Follow-up vencido",
            leadId: fu.lead_id,
            leadName: lead.company || lead.name,
            severity: "critical",
          });
        }
      }
    });

    // Sort: critical first
    result.sort((a, b) => (a.severity === "critical" ? -1 : 1) - (b.severity === "critical" ? -1 : 1));
    return result;
  }, [activeLeads, followUps]);

  // SDR metrics
  const sdrMetrics = useMemo(() => {
    const sdrProfiles = profiles.filter((p) => p.role_label?.toLowerCase() === "sdr");
    const sdrIds = new Set(sdrProfiles.map((p) => p.id));

    const sdrLeads = activeLeads.filter((l) => l.assigned_to && sdrIds.has(l.assigned_to));
    const bvLeads = sdrLeads.filter((l) => ["boas_vindas", "em_contato"].includes(l.kanban_stage));

    // Protocol completion rate
    const protocolComplete = bvLeads.filter((l) => l.welcome_sent && l.linkedin_added && l.whatsapp_sent).length;
    const protocolRate = bvLeads.length > 0 ? Math.round((protocolComplete / bvLeads.length) * 100) : 100;

    // Activation rate (leads that moved beyond boas_vindas)
    const activated = sdrLeads.filter((l) => !["novo", "boas_vindas"].includes(l.kanban_stage)).length;
    const activationRate = sdrLeads.length > 0 ? Math.round((activated / sdrLeads.length) * 100) : 0;

    // SLA compliance
    const pendingFollowUpLeadIds = new Set(followUps.map((f) => f.lead_id));
    const sdrStagedLeads = sdrLeads.filter((l) => !["fechado", "perdido"].includes(l.kanban_stage));
    const withinSla = sdrStagedLeads.filter((l) => getUrgencyLevel(l.kanban_stage, l.stage_updated_at, l.last_activity_at, pendingFollowUpLeadIds.has(l.id)) === "normal").length;
    const slaCompliance = sdrStagedLeads.length > 0 ? Math.round((withinSla / sdrStagedLeads.length) * 100) : 100;

    return {
      profiles: sdrProfiles,
      totalLeads: sdrLeads.length,
      protocolRate,
      activationRate,
      slaCompliance,
    };
  }, [activeLeads, profiles, followUps]);

  // Closer metrics
  const closerMetrics = useMemo(() => {
    const closerProfiles = profiles.filter((p) => p.role_label?.toLowerCase() === "closer");
    const closerIds = new Set(closerProfiles.map((p) => p.id));

    const closerLeads = activeLeads.filter((l) => l.assigned_to && closerIds.has(l.assigned_to));
    const closed = closerLeads.filter((l) => l.kanban_stage === "fechado").length;
    const conversionRate = closerLeads.length > 0 ? Math.round((closed / closerLeads.length) * 100) : 0;

    // Value in pipeline
    const closerLeadIds = new Set(closerLeads.filter((l) => l.kanban_stage !== "fechado").map((l) => l.id));
    const pipelineValue = proposals
      .filter((p) => p.lead_id && closerLeadIds.has(p.lead_id))
      .reduce((sum, p) => {
        if (!p.investment) return sum;
        const nums = p.investment.match(/[\d.,]+/g);
        if (!nums) return sum;
        const val = parseFloat(nums[0].replace(/\./g, "").replace(",", "."));
        return sum + (isNaN(val) ? 0 : val);
      }, 0);

    return {
      profiles: closerProfiles,
      totalLeads: closerLeads.length,
      closed,
      conversionRate,
      pipelineValue,
    };
  }, [activeLeads, profiles, proposals]);

  return {
    loading,
    leads: activeLeads,
    lostLeads,
    pipelineCounts,
    healthScore,
    stageHealth,
    velocity7d,
    activitiesToday,
    pipelineTotal,
    alerts,
    profiles,
    sdrMetrics,
    closerMetrics,
  };
}

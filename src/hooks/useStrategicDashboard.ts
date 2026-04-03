import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUrgencyLevel } from "@/components/admin/UrgencyBadge";
import { differenceInDays, subDays } from "date-fns";

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
  lost_at_stage: string | null;
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

export interface CampaignGoals {
  em_contato_pct: number;
  agendamentos_pct: number;
  propostas_pct: number;
  deals_count: number;
  deals_value: number;
}

export interface Campaign {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  goals: CampaignGoals;
  is_active: boolean;
  created_at: string;
}

export interface CampaignKPI {
  key: string;
  label: string;
  current: number;
  target: number;
  unit: "pct" | "count" | "currency";
  pct: number; // progress toward goal (0-100+)
}

const ACTIVE_STAGES = ["novo", "boas_vindas", "em_contato", "call_agendada", "proposta", "nutricao", "fechado"];

const STAGE_ORDER = ["novo", "boas_vindas", "em_contato", "call_agendada", "proposta", "nutricao", "fechado"];

function maxReachedStage(lead: DashboardLead): string {
  if (lead.kanban_stage === "perdido") return lead.lost_at_stage || "boas_vindas";
  return lead.kanban_stage;
}

function hasReachedAtLeast(lead: DashboardLead, stage: string): boolean {
  const idx = STAGE_ORDER.indexOf(stage);
  const reachedIdx = STAGE_ORDER.indexOf(maxReachedStage(lead));
  return reachedIdx >= idx;
}

const ADVANCED_STAGES: Record<string, string[]> = {
  em_contato: ["em_contato", "call_agendada", "proposta", "nutricao", "fechado"],
  call_agendada: ["call_agendada", "proposta", "nutricao", "fechado"],
  proposta: ["proposta", "nutricao", "fechado"],
};

function parseInvestment(text: string | null): number {
  if (!text) return 0;
  const multiMatch = text.match(/(\d+)\s*x\s*(?:de\s*)?R?\$?\s*([\d.,]+)/i);
  if (multiMatch) {
    const multiplier = parseInt(multiMatch[1]);
    const val = parseFloat(multiMatch[2].replace(/\./g, "").replace(",", "."));
    return isNaN(val) ? 0 : val * multiplier;
  }
  const nums = text.match(/[\d.,]+/g);
  if (!nums) return 0;
  const val = parseFloat(nums[0].replace(/\./g, "").replace(",", "."));
  return isNaN(val) ? 0 : val;
}

const TEST_DOMAINS = ["@atinaedu.com.br", "@movimentocircular.io"];
const isTestEmail = (email: string) =>
  TEST_DOMAINS.some((d) => email.toLowerCase().endsWith(d));

export function useStrategicDashboard() {
  const [leads, setLeads] = useState<DashboardLead[]>([]);
  const [, setActivities] = useState<DashboardActivity[]>([]);
  const [profiles, setProfiles] = useState<DashboardProfile[]>([]);
  const [proposals, setProposals] = useState<DashboardProposal[]>([]);
  const [followUps, setFollowUps] = useState<{ lead_id: string; due_date: string; completed: boolean }[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const sevenDaysAgo = subDays(new Date(), 7).toISOString();

    const [leadsRes, activitiesRes, profilesRes, proposalsRes, followUpsRes, campaignsRes] = await Promise.all([
      supabase.from("leads").select("*").neq("status", "archived"),
      supabase.from("lead_activities").select("id, lead_id, activity_type, created_at, user_id").gte("created_at", sevenDaysAgo),
      supabase.from("profiles").select("id, full_name, role_label, badge_initials"),
      supabase.from("proposals").select("id, investment, lead_id, status"),
      supabase.from("lead_follow_ups").select("lead_id, due_date, completed").eq("completed", false),
      supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
    ]);

    if (leadsRes.data) setLeads((leadsRes.data as DashboardLead[]).filter(l => !isTestEmail(l.email)));
    if (activitiesRes.data) setActivities(activitiesRes.data as DashboardActivity[]);
    if (profilesRes.data) setProfiles(profilesRes.data as DashboardProfile[]);
    if (proposalsRes.data) setProposals(proposalsRes.data as DashboardProposal[]);
    if (followUpsRes.data) setFollowUps(followUpsRes.data);
    if (campaignsRes.data) setCampaigns(campaignsRes.data.map((c: any) => ({ ...c, goals: c.goals as CampaignGoals })));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();

    const leadsChannel = supabase
      .channel("strategic-leads")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => fetchAll())
      .subscribe();

    const activitiesChannel = supabase
      .channel("strategic-activities")
      .on("postgres_changes", { event: "*", schema: "public", table: "lead_activities" }, () => fetchAll())
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(activitiesChannel);
    };
  }, [fetchAll]);

  // Active campaign
  const activeCampaign = useMemo(() => campaigns.find((c) => c.is_active) || null, [campaigns]);

  const activeLeads = useMemo(() => leads.filter((l) => l.status !== "lost"), [leads]);
  const lostLeads = useMemo(() => leads.filter((l) => l.status === "lost"), [leads]);

  // Campaign-period leads
  const campaignLeads = useMemo(() => {
    if (!activeCampaign) return activeLeads;
    const start = new Date(activeCampaign.starts_at);
    const end = new Date(activeCampaign.ends_at);
    end.setHours(23, 59, 59, 999);
    return leads.filter((l) => {
      if (!l.created_at) return false;
      const d = new Date(l.created_at);
      return d >= start && d <= end;
    });
  }, [leads, activeLeads, activeCampaign]);

  // Campaign KPIs
  const campaignKPIs = useMemo((): CampaignKPI[] => {
    if (!activeCampaign) return [];
    const goals = activeCampaign.goals;
    const total = campaignLeads.length;

    // Em contato: leads que passaram de boas_vindas (reached em_contato+) / total
    const emContatoCount = campaignLeads.filter((l) => hasReachedAtLeast(l, "em_contato")).length;
    const emContatoPct = total > 0 ? Math.round((emContatoCount / total) * 100) : 0;

    // Agendamentos: leads call_agendada+ / em_contato+
    const agendBase = emContatoCount;
    const agendCount = campaignLeads.filter((l) => hasReachedAtLeast(l, "call_agendada")).length;
    const agendPct = agendBase > 0 ? Math.round((agendCount / agendBase) * 100) : 0;

    // Propostas: leads proposta+ / call_agendada+
    const propBase = agendCount;
    const propCount = campaignLeads.filter((l) => hasReachedAtLeast(l, "proposta")).length;
    const propPct = propBase > 0 ? Math.round((propCount / propBase) * 100) : 0;

    // Deals (only actually closed, not lost)
    const dealsCount = campaignLeads.filter((l) => l.kanban_stage === "fechado").length;

    // Revenue
    const closedLeadIds = new Set(campaignLeads.filter((l) => l.kanban_stage === "fechado").map((l) => l.id));
    const dealsValue = proposals
      .filter((p) => p.lead_id && closedLeadIds.has(p.lead_id))
      .reduce((sum, p) => sum + parseInvestment(p.investment), 0);

    return [
      {
        key: "em_contato",
        label: "Em Contato",
        current: emContatoPct,
        target: goals.em_contato_pct || 40,
        unit: "pct",
        pct: goals.em_contato_pct > 0 ? Math.round((emContatoPct / goals.em_contato_pct) * 100) : 0,
      },
      {
        key: "agendamentos",
        label: "Agendamentos",
        current: agendPct,
        target: goals.agendamentos_pct || 50,
        unit: "pct",
        pct: goals.agendamentos_pct > 0 ? Math.round((agendPct / goals.agendamentos_pct) * 100) : 0,
      },
      {
        key: "propostas",
        label: "Propostas",
        current: propPct,
        target: goals.propostas_pct || 60,
        unit: "pct",
        pct: goals.propostas_pct > 0 ? Math.round((propPct / goals.propostas_pct) * 100) : 0,
      },
      {
        key: "deals",
        label: "Deals",
        current: dealsCount,
        target: goals.deals_count || 5,
        unit: "count",
        pct: goals.deals_count > 0 ? Math.round((dealsCount / goals.deals_count) * 100) : 0,
      },
      {
        key: "revenue",
        label: "Receita",
        current: dealsValue,
        target: goals.deals_value || 100000,
        unit: "currency",
        pct: goals.deals_value > 0 ? Math.round((dealsValue / goals.deals_value) * 100) : 0,
      },
    ];
  }, [campaignLeads, activeCampaign, proposals]);

  // Pipeline counts per stage
  const pipelineCounts = useMemo(() => {
    const counts: Record<string, DashboardLead[]> = {};
    ACTIVE_STAGES.forEach((s) => (counts[s] = []));
    activeLeads.forEach((l) => {
      if (counts[l.kanban_stage]) counts[l.kanban_stage].push(l);
    });
    return counts;
  }, [activeLeads]);

  // Health Score
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

  // Stage health
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

  // Pipeline total value
  const pipelineTotal = useMemo(() => {
    const openLeadIds = new Set(activeLeads.filter((l) => l.kanban_stage !== "fechado").map((l) => l.id));
    return proposals
      .filter((p) => p.lead_id && openLeadIds.has(p.lead_id))
      .reduce((sum, p) => sum + parseInvestment(p.investment), 0);
  }, [activeLeads, proposals]);

  // SDR metrics
  const sdrMetrics = useMemo(() => {
    const sdrProfiles = profiles.filter((p) => p.role_label?.toLowerCase() === "sdr");
    const sdrIds = new Set(sdrProfiles.map((p) => p.id));
    const sdrLeads = activeLeads.filter((l) => l.assigned_to && sdrIds.has(l.assigned_to));
    const bvLeads = sdrLeads.filter((l) => ["boas_vindas", "em_contato"].includes(l.kanban_stage));
    const protocolComplete = bvLeads.filter((l) => l.welcome_sent && l.linkedin_added && l.whatsapp_sent).length;
    const protocolRate = bvLeads.length > 0 ? Math.round((protocolComplete / bvLeads.length) * 100) : 0;
    const activated = sdrLeads.filter((l) => !["novo", "boas_vindas"].includes(l.kanban_stage)).length;
    const activationRate = sdrLeads.length > 0 ? Math.round((activated / sdrLeads.length) * 100) : 0;
    const pendingFollowUpLeadIds = new Set(followUps.map((f) => f.lead_id));
    const sdrStagedLeads = sdrLeads.filter((l) => !["fechado", "perdido"].includes(l.kanban_stage));
    const withinSla = sdrStagedLeads.filter((l) => getUrgencyLevel(l.kanban_stage, l.stage_updated_at, l.last_activity_at, pendingFollowUpLeadIds.has(l.id)) === "normal").length;
    const slaCompliance = sdrStagedLeads.length > 0 ? Math.round((withinSla / sdrStagedLeads.length) * 100) : 0;
    return { profiles: sdrProfiles, totalLeads: sdrLeads.length, protocolRate, activationRate, slaCompliance };
  }, [activeLeads, profiles, followUps]);

  // Closer metrics
  const closerMetrics = useMemo(() => {
    const closerProfiles = profiles.filter((p) => p.role_label?.toLowerCase() === "closer");
    const closerIds = new Set(closerProfiles.map((p) => p.id));
    const closerLeads = activeLeads.filter((l) => l.assigned_to && closerIds.has(l.assigned_to));
    const closed = closerLeads.filter((l) => l.kanban_stage === "fechado").length;
    const conversionRate = closerLeads.length > 0 ? Math.round((closed / closerLeads.length) * 100) : 0;
    const closerLeadIds = new Set(closerLeads.filter((l) => l.kanban_stage !== "fechado").map((l) => l.id));
    const pipelineValue = proposals
      .filter((p) => p.lead_id && closerLeadIds.has(p.lead_id))
      .reduce((sum, p) => sum + parseInvestment(p.investment), 0);
    return { profiles: closerProfiles, totalLeads: closerLeads.length, closed, conversionRate, pipelineValue };
  }, [activeLeads, profiles, proposals]);

  // Conversion funnel — uses maxReachedStage so lost leads count at the stage they reached
  const funnelData = useMemo(() => {
    const stageOrder = ["novo", "boas_vindas", "em_contato", "call_agendada", "proposta", "nutricao", "fechado"];
    const stageLabels: Record<string, string> = {
      novo: "Novo", boas_vindas: "Boas-Vindas", em_contato: "Em Contato",
      call_agendada: "Call", proposta: "Proposta", nutricao: "Nutrição", fechado: "Fechado",
    };
    // Use campaign leads (including lost) when campaign is active
    const funnelLeads = activeCampaign ? campaignLeads : [...activeLeads, ...lostLeads];
    const reachedStage = (stage: string) => {
      return funnelLeads.filter((l) => hasReachedAtLeast(l, stage)).length;
    };
    return stageOrder.map((stage, i) => {
      const reached = reachedStage(stage);
      const current = funnelLeads.filter((l) => maxReachedStage(l) === stage).length;
      const prevReached = i > 0 ? reachedStage(stageOrder[i - 1]) : reached;
      const conversionRate = prevReached > 0 ? Math.round((reached / prevReached) * 100) : 0;
      return { stage, label: stageLabels[stage], current, reached, conversionRate };
    });
  }, [activeLeads, lostLeads, campaignLeads, activeCampaign]);

  // Daily actions
  const dailyActions = useMemo(() => {
    const actions: { priority: number; icon: string; text: string }[] = [];
    const now = new Date();
    const novosLeads = pipelineCounts["novo"] || [];
    if (novosLeads.length > 0) actions.push({ priority: 1, icon: "🆕", text: `${novosLeads.length} lead(s) novo(s) aguardando primeiro contato` });
    const overdueFollowUps = followUps.filter((f) => new Date(f.due_date) < now);
    if (overdueFollowUps.length > 0) actions.push({ priority: 2, icon: "⏰", text: `${overdueFollowUps.length} follow-up(s) vencido(s)` });
    const bvIncomplete = activeLeads.filter((l) => ["boas_vindas", "em_contato"].includes(l.kanban_stage) && (!l.welcome_sent || !l.linkedin_added || !l.whatsapp_sent));
    if (bvIncomplete.length > 0) actions.push({ priority: 3, icon: "📋", text: `${bvIncomplete.length} protocolo(s) BV incompleto(s)` });
    const callsNoBriefing = (pipelineCounts["call_agendada"] || []).filter((l) => !l.briefing_notes);
    if (callsNoBriefing.length > 0) actions.push({ priority: 4, icon: "📝", text: `${callsNoBriefing.length} call(s) sem briefing preenchido` });
    const staleLeads = activeLeads.filter((l) => ["proposta", "nutricao"].includes(l.kanban_stage) && l.last_activity_at && differenceInDays(now, new Date(l.last_activity_at)) > 3);
    if (staleLeads.length > 0) actions.push({ priority: 5, icon: "💤", text: `${staleLeads.length} lead(s) parado(s) há mais de 3 dias` });
    return actions.sort((a, b) => a.priority - b.priority);
  }, [activeLeads, pipelineCounts, followUps]);

  return {
    loading,
    leads: activeLeads,
    lostLeads,
    pipelineCounts,
    healthScore,
    stageHealth,
    pipelineTotal,
    profiles,
    sdrMetrics,
    closerMetrics,
    funnelData,
    dailyActions,
    activeCampaign,
    campaigns,
    campaignKPIs,
    campaignLeads,
    refetch: fetchAll,
  };
}

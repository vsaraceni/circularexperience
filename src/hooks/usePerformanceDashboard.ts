import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, differenceInHours, format, subDays, startOfDay, isAfter, isBefore, parseISO } from "date-fns";

const TEST_DOMAINS = ["@atinaedu.com.br", "@movimentocircular.io"];
const isTestEmail = (email: string) =>
  TEST_DOMAINS.some((d) => email.toLowerCase().endsWith(d));

const STAGE_THRESHOLDS: Record<string, { warning: number; critical: number }> = {
  novo: { warning: 1, critical: 2 },
  boas_vindas: { warning: 2, critical: 4 },
  em_contato: { warning: 3, critical: 5 },
  call_agendada: { warning: 3, critical: 7 },
  proposta: { warning: 5, critical: 10 },
  nutricao: { warning: 7, critical: 14 },
};

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

const ACTION_CATEGORIES: Record<string, string> = {
  welcome_enviado: "Comunicação",
  linkedin_adicionado: "Comunicação",
  whatsapp_enviado: "Comunicação",
  template_copiado: "Comunicação",
  contato_registrado: "Comunicação",
  stage_mudou: "Progresso",
  em_contato: "Progresso",
  call_agendada: "Progresso",
  call_realizada: "Progresso",
  fechado: "Progresso",
  perdido: "Progresso",
  proposta_gerada: "Propostas",
  proposta_enviada: "Propostas",
  follow_up_agendado: "Follow-up",
  follow_up_concluido: "Follow-up",
  nota_manual: "Outros",
  lead_recebido: "Outros",
  lead_atribuido: "Outros",
  lead_reatribuido: "Outros",
  empresa_enriquecida: "Outros",
};

export interface PerformanceLead {
  id: string;
  name: string;
  company: string | null;
  email: string;
  kanban_stage: string;
  status: string;
  assigned_to: string | null;
  stage_updated_at: string | null;
  last_activity_at: string | null;
  created_at: string | null;
}

export interface AgingLead {
  id: string;
  name: string;
  company: string | null;
  stage: string;
  stageLabel: string;
  daysInStage: number;
  lastActivity: string | null;
  assignedTo: string | null;
  assignedName: string | null;
  severity: "warning" | "critical";
}

export interface DailyActionData {
  date: string;
  Comunicação: number;
  Progresso: number;
  Propostas: number;
  "Follow-up": number;
  Outros: number;
  total: number;
}

export interface FollowUpMetrics {
  scheduled: number;
  completed: number;
  overdue: number;
  rate: number;
  overdueList: { leadId: string; leadName: string; company: string | null; dueDate: string; note: string | null }[];
}

export function usePerformanceDashboard() {
  const [leads, setLeads] = useState<PerformanceLead[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; full_name: string | null }[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [periodDays, setPeriodDays] = useState(30);
  const [ownerFilter, setOwnerFilter] = useState("all");

  const fetchAll = useCallback(async () => {
    const cutoff = subDays(new Date(), periodDays).toISOString();

    const [leadsRes, activitiesRes, profilesRes, followUpsRes] = await Promise.all([
      supabase.from("leads").select("id, name, company, email, kanban_stage, status, assigned_to, stage_updated_at, last_activity_at, created_at").neq("status", "archived"),
      supabase.from("lead_activities").select("id, lead_id, activity_type, created_at, user_id, metadata").gte("created_at", cutoff),
      supabase.from("profiles").select("id, full_name"),
      supabase.from("lead_follow_ups").select("id, lead_id, due_date, completed, completed_at, created_at, note").gte("created_at", cutoff),
    ]);

    if (leadsRes.data) setLeads((leadsRes.data as PerformanceLead[]).filter(l => !isTestEmail(l.email)));
    if (activitiesRes.data) setActivities(activitiesRes.data);
    if (profilesRes.data) setProfiles(profilesRes.data);
    if (followUpsRes.data) setFollowUps(followUpsRes.data);
    setLoading(false);
  }, [periodDays]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const profileMap = useMemo(() => {
    const m: Record<string, string> = {};
    profiles.forEach(p => { if (p.full_name) m[p.id] = p.full_name; });
    return m;
  }, [profiles]);

  const filteredLeads = useMemo(() => {
    let result = leads;
    if (ownerFilter !== "all") result = result.filter(l => l.assigned_to === ownerFilter);
    return result;
  }, [leads, ownerFilter]);

  const filteredActivities = useMemo(() => {
    if (ownerFilter === "all") return activities;
    const leadIds = new Set(filteredLeads.map(l => l.id));
    return activities.filter(a => leadIds.has(a.lead_id));
  }, [activities, filteredLeads, ownerFilter]);

  // Aging leads
  const agingLeads = useMemo((): AgingLead[] => {
    const now = new Date();
    const result: AgingLead[] = [];
    filteredLeads.forEach(l => {
      if (["fechado", "perdido"].includes(l.kanban_stage)) return;
      if (l.status === "lost") return;
      const threshold = STAGE_THRESHOLDS[l.kanban_stage];
      if (!threshold) return;
      const days = l.stage_updated_at ? differenceInDays(now, new Date(l.stage_updated_at)) : 0;
      if (days < threshold.warning) return;
      result.push({
        id: l.id,
        name: l.name,
        company: l.company,
        stage: l.kanban_stage,
        stageLabel: STAGE_LABELS[l.kanban_stage] || l.kanban_stage,
        daysInStage: days,
        lastActivity: l.last_activity_at,
        assignedTo: l.assigned_to,
        assignedName: l.assigned_to ? profileMap[l.assigned_to] || null : null,
        severity: days >= threshold.critical ? "critical" : "warning",
      });
    });
    return result.sort((a, b) => b.daysInStage - a.daysInStage);
  }, [filteredLeads, profileMap]);

  // Follow-up discipline
  const followUpMetrics = useMemo((): FollowUpMetrics => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const relevantLeadIds = ownerFilter === "all" ? null : new Set(filteredLeads.map(l => l.id));

    const filtered = relevantLeadIds ? followUps.filter(f => relevantLeadIds.has(f.lead_id)) : followUps;

    const scheduled = filtered.length;
    const completed = filtered.filter(f => f.completed).length;
    const overdueFUs = filtered.filter(f => !f.completed && isBefore(new Date(f.due_date + "T23:59:59"), now));

    const leadMap = new Map(leads.map(l => [l.id, l]));

    return {
      scheduled,
      completed,
      overdue: overdueFUs.length,
      rate: scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0,
      overdueList: overdueFUs.map(f => {
        const lead = leadMap.get(f.lead_id);
        return {
          leadId: f.lead_id,
          leadName: lead?.name || "—",
          company: lead?.company || null,
          dueDate: f.due_date,
          note: f.note,
        };
      }).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    };
  }, [followUps, filteredLeads, ownerFilter, leads]);

  // Daily actions
  const dailyActions = useMemo((): DailyActionData[] => {
    const map: Record<string, DailyActionData> = {};
    const days = periodDays;

    // Init all days
    for (let i = 0; i < days; i++) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      map[d] = { date: d, Comunicação: 0, Progresso: 0, Propostas: 0, "Follow-up": 0, Outros: 0, total: 0 };
    }

    filteredActivities.forEach(a => {
      if (!a.created_at) return;
      const day = format(new Date(a.created_at), "yyyy-MM-dd");
      if (!map[day]) return;
      const cat = ACTION_CATEGORIES[a.activity_type] || "Outros";
      (map[day] as any)[cat] = ((map[day] as any)[cat] || 0) + 1;
      map[day].total += 1;
    });

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredActivities, periodDays]);

  // Actions per day average
  const actionsPerDay = useMemo(() => {
    if (dailyActions.length === 0) return 0;
    const total = dailyActions.reduce((s, d) => s + d.total, 0);
    return Math.round((total / dailyActions.length) * 10) / 10;
  }, [dailyActions]);

  // Briefing data
  const briefingData = useMemo(() => {
    const activeLeads = leads.filter(l => !["fechado", "perdido"].includes(l.kanban_stage) && l.status !== "lost");
    const stageCounts: Record<string, number> = {};
    activeLeads.forEach(l => {
      stageCounts[l.kanban_stage] = (stageCounts[l.kanban_stage] || 0) + 1;
    });

    const now = new Date();
    const slaBreached = agingLeads.filter(a => a.severity === "critical").length;

    const todayStr = format(now, "yyyy-MM-dd");
    const todayFollowUps = followUps.filter(f => !f.completed && f.due_date === todayStr).length;
    const overdueFollowUps = followUps.filter(f => !f.completed && f.due_date < todayStr).length;

    const yesterdayStr = format(subDays(now, 1), "yyyy-MM-dd");
    const yesterdayActions = dailyActions.find(d => d.date === yesterdayStr)?.total || 0;

    return { stageCounts, slaBreached, todayFollowUps, overdueFollowUps, yesterdayActions };
  }, [leads, agingLeads, followUps, dailyActions]);

  return {
    loading,
    leads: filteredLeads,
    profiles,
    profileMap,
    agingLeads,
    followUpMetrics,
    dailyActions,
    actionsPerDay,
    briefingData,
    periodDays,
    setPeriodDays,
    ownerFilter,
    setOwnerFilter,
    refetch: fetchAll,
  };
}

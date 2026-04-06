import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { ClipboardCopy, FileBarChart, Loader2 } from "lucide-react";

const TEST_DOMAINS = ["@atinaedu.com.br", "@movimentocircular.io"];
const isTestEmail = (email: string) => TEST_DOMAINS.some((d) => email.toLowerCase().endsWith(d));

const STAGE_THRESHOLDS: Record<string, { warning: number; critical: number }> = {
  novo: { warning: 1, critical: 2 },
  boas_vindas: { warning: 2, critical: 4 },
  em_contato: { warning: 3, critical: 5 },
  call_agendada: { warning: 3, critical: 7 },
  proposta: { warning: 5, critical: 10 },
  nutricao: { warning: 7, critical: 14 },
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

type PeriodKey = "today" | "yesterday" | "last_week" | "last_month" | "last_30";

const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "last_week", label: "Semana passada" },
  { value: "last_month", label: "Mês passado" },
  { value: "last_30", label: "Últimos 30 dias" },
];

function getPeriodRange(key: PeriodKey): { from: Date; to: Date; label: string } {
  const now = new Date();
  switch (key) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now), label: format(now, "dd/MM/yyyy") };
    case "yesterday": {
      const y = subDays(now, 1);
      return { from: startOfDay(y), to: endOfDay(y), label: format(y, "dd/MM/yyyy") };
    }
    case "last_week": {
      const ws = startOfWeek(subDays(now, 7), { locale: ptBR });
      const we = endOfWeek(subDays(now, 7), { locale: ptBR });
      return { from: ws, to: we, label: `${format(ws, "dd/MM")} a ${format(we, "dd/MM")}` };
    }
    case "last_month": {
      const ms = startOfMonth(subDays(startOfMonth(now), 1));
      const me = endOfMonth(ms);
      return { from: ms, to: me, label: format(ms, "MMMM/yyyy", { locale: ptBR }) };
    }
    case "last_30": {
      const from = subDays(now, 30);
      return { from: startOfDay(from), to: endOfDay(now), label: `${format(from, "dd/MM")} a ${format(now, "dd/MM")}` };
    }
  }
}

interface ReportData {
  periodLabel: string;
  missions: { label: string; count: number; resolved: boolean }[];
  missionsResolved: number;
  missionsTotal: number;
  actionsTotal: number;
  actionsByCategory: Record<string, number>;
  followUpsScheduled: number;
  followUpsCompleted: number;
  followUpsOverdue: number;
  slaCriticalCount: number;
}

export default function DigestReportDialog() {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<PeriodKey>("today");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setReport(null);

    const { from, to, label } = getPeriodRange(period);
    const fromISO = from.toISOString();
    const toISO = to.toISOString();

    const [leadsRes, activitiesRes, followUpsRes] = await Promise.all([
      supabase.from("leads").select("id, name, email, kanban_stage, status, stage_updated_at, last_activity_at, call_date, briefing_notes"),
      supabase.from("lead_activities").select("id, activity_type, created_at").gte("created_at", fromISO).lte("created_at", toISO),
      supabase.from("lead_follow_ups").select("id, lead_id, due_date, completed, completed_at"),
    ]);

    const allLeads = (leadsRes.data || []).filter((l: any) => !isTestEmail(l.email));
    const activeLeads = allLeads.filter((l: any) => !["fechado", "perdido"].includes(l.kanban_stage) && l.status !== "lost");
    const activities = activitiesRes.data || [];
    const followUps = followUpsRes.data || [];

    // Missions (current state, same logic as MissionsBanner)
    const novos = activeLeads.filter((l: any) => l.kanban_stage === "novo").length;
    const boasVindas = activeLeads.filter((l: any) => {
      if (l.kanban_stage !== "boas_vindas") return false;
      const days = l.stage_updated_at ? Math.floor((Date.now() - new Date(l.stage_updated_at).getTime()) / 86400000) : 0;
      return days >= (STAGE_THRESHOLDS.boas_vindas?.warning || 2);
    }).length;
    const emContato = activeLeads.filter((l: any) => l.kanban_stage === "em_contato").length;
    const callsHoje = activeLeads.filter((l: any) => {
      if (l.kanban_stage !== "call_agendada" || !l.call_date) return false;
      const d = new Date(l.call_date);
      const now = new Date();
      return format(d, "yyyy-MM-dd") === format(now, "yyyy-MM-dd") || format(d, "yyyy-MM-dd") === format(subDays(now, -1), "yyyy-MM-dd");
    }).length;
    const briefings = activeLeads.filter((l: any) =>
      ["call_agendada", "proposta"].includes(l.kanban_stage) && (!l.briefing_notes || l.briefing_notes.trim() === "")
    ).length;

    const missions = [
      { label: "Novos", count: novos, resolved: novos === 0 },
      { label: "Follow-up", count: boasVindas, resolved: boasVindas === 0 },
      { label: "Agendamento", count: emContato, resolved: emContato === 0 },
      { label: "Calls", count: callsHoje, resolved: callsHoje === 0 },
      { label: "Briefing", count: briefings, resolved: briefings === 0 },
    ];

    // Actions by category
    const cats: Record<string, number> = {};
    activities.forEach((a: any) => {
      const cat = ACTION_CATEGORIES[a.activity_type] || "Outros";
      cats[cat] = (cats[cat] || 0) + 1;
    });

    // Follow-ups
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    const fuScheduled = followUps.length;
    const fuCompleted = followUps.filter((f: any) => f.completed).length;
    const fuOverdue = followUps.filter((f: any) => !f.completed && isBefore(new Date(f.due_date + "T23:59:59"), now)).length;

    // SLA critical
    const slaCritical = activeLeads.filter((l: any) => {
      const th = STAGE_THRESHOLDS[l.kanban_stage];
      if (!th) return false;
      const days = l.stage_updated_at ? Math.floor((Date.now() - new Date(l.stage_updated_at).getTime()) / 86400000) : 0;
      return days >= th.critical;
    }).length;

    setReport({
      periodLabel: label,
      missions,
      missionsResolved: missions.filter(m => m.resolved).length,
      missionsTotal: missions.length,
      actionsTotal: activities.length,
      actionsByCategory: cats,
      followUpsScheduled: fuScheduled,
      followUpsCompleted: fuCompleted,
      followUpsOverdue: fuOverdue,
      slaCriticalCount: slaCritical,
    });
    setLoading(false);
  }, [period]);

  const plainText = useMemo(() => {
    if (!report) return "";
    const lines: string[] = [];
    lines.push(`☀️ Relatório de Avanços — ${report.periodLabel}`);
    lines.push("");
    lines.push(`🎯 Missões: ${report.missionsResolved}/${report.missionsTotal} resolvidas`);
    report.missions.forEach(m => {
      lines.push(`  ${m.resolved ? "✅" : "⚠️"} ${m.label} (${m.count})`);
    });
    lines.push("");
    const catParts = Object.entries(report.actionsByCategory).map(([k, v]) => `${k}: ${v}`).join(" | ");
    lines.push(`📊 Ações no período: ${report.actionsTotal}`);
    if (catParts) lines.push(`  ${catParts}`);
    lines.push("");
    lines.push(`📋 Follow-ups: ${report.followUpsScheduled} agendados, ${report.followUpsCompleted} concluídos, ${report.followUpsOverdue} atrasados`);
    lines.push(`🚨 SLA críticos: ${report.slaCriticalCount} leads`);
    return lines.join("\n");
  }, [report]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(plainText);
    toast({ title: "Relatório copiado!", description: "Cole no WhatsApp ou email." });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-normal hover:bg-accent transition-colors text-left">
          <FileBarChart className="h-4 w-4" /> Relatório de Avanços
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Relatório de Avanços</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={generate} disabled={loading} size="sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Gerar
          </Button>
        </div>

        {report && (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-4 text-sm">
              {/* Missions */}
              <div className="rounded-lg border p-3" style={{ borderColor: "hsl(var(--color-border))" }}>
                <p className="font-semibold mb-2" style={{ color: "hsl(var(--color-text-primary))" }}>
                  🎯 Missões: {report.missionsResolved}/{report.missionsTotal} resolvidas
                </p>
                <div className="w-full h-2 rounded-full mb-2" style={{ background: "hsl(var(--color-bg-subtle))" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(report.missionsResolved / report.missionsTotal) * 100}%`, background: "#2FB2C0" }}
                  />
                </div>
                <div className="space-y-1">
                  {report.missions.map(m => (
                    <div key={m.label} className="flex items-center gap-2 text-xs">
                      <span>{m.resolved ? "✅" : "⚠️"}</span>
                      <span style={{ color: m.resolved ? "hsl(var(--color-text-muted))" : "hsl(var(--color-text-primary))" }}>
                        {m.label}
                      </span>
                      <span className="font-semibold" style={{ color: m.resolved ? "#388E3C" : "#F4A736" }}>
                        ({m.count})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="rounded-lg border p-3" style={{ borderColor: "hsl(var(--color-border))" }}>
                <p className="font-semibold mb-1" style={{ color: "hsl(var(--color-text-primary))" }}>
                  📊 Ações no período: {report.actionsTotal}
                </p>
                <div className="flex flex-wrap gap-2 text-xs" style={{ color: "hsl(var(--color-text-secondary))" }}>
                  {Object.entries(report.actionsByCategory).map(([cat, count]) => (
                    <span key={cat} className="px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--color-bg-subtle))" }}>
                      {cat}: <strong>{count}</strong>
                    </span>
                  ))}
                </div>
              </div>

              {/* Follow-ups + SLA */}
              <div className="rounded-lg border p-3 space-y-1" style={{ borderColor: "hsl(var(--color-border))" }}>
                <p className="text-xs" style={{ color: "hsl(var(--color-text-secondary))" }}>
                  📋 Follow-ups: <strong>{report.followUpsScheduled}</strong> agendados, <strong>{report.followUpsCompleted}</strong> concluídos, <strong style={{ color: report.followUpsOverdue > 0 ? "#EB626D" : undefined }}>{report.followUpsOverdue}</strong> atrasados
                </p>
                <p className="text-xs" style={{ color: report.slaCriticalCount > 0 ? "#EB626D" : "hsl(var(--color-text-secondary))" }}>
                  🚨 SLA críticos: <strong>{report.slaCriticalCount}</strong> leads
                </p>
              </div>

              <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleCopy}>
                <ClipboardCopy className="h-4 w-4" /> Copiar relatório
              </Button>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import CrmNavbar from "@/components/admin/CrmNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { usePerformanceDashboard } from "@/hooks/usePerformanceDashboard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Clock, AlertTriangle, TrendingUp, CalendarCheck } from "lucide-react";
import LeadDrawer from "@/components/admin/LeadDrawer";
import { supabase } from "@/integrations/supabase/client";

const CATEGORY_COLORS: Record<string, string> = {
  Comunicação: "#2FB2C0",
  Progresso: "#5F2558",
  Propostas: "#F4A736",
  "Follow-up": "#EB626D",
  Outros: "#9CA3AF",
};

const PerformanceDashboard = () => {
  const navigate = useNavigate();
  const {
    loading, profiles, profileMap, agingLeads, followUpMetrics,
    dailyActions, actionsPerDay, periodDays, setPeriodDays,
    ownerFilter, setOwnerFilter,
  } = usePerformanceDashboard();

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="h-screen flex flex-col" style={{ background: 'hsl(var(--color-bg-page))' }}>
        <CrmNavbar currentModule="performance" />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'hsl(var(--color-brand))' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: 'hsl(var(--color-bg-page))' }}>
      <CrmNavbar currentModule="performance" />

      <main className="flex-1 overflow-auto px-4 md:px-6 py-5 space-y-5">
        {/* Header + Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-xl font-bold" style={{ color: 'hsl(var(--color-text-primary))' }}>
            Performance do Funil
          </h1>
          <div className="flex items-center gap-2">
            <Select value={String(periodDays)} onValueChange={(v) => setPeriodDays(Number(v))}>
              <SelectTrigger className="w-[140px] h-8 rounded-lg text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="14">Últimos 14 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="w-[160px] h-8 rounded-lg text-xs">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                {profiles.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name || p.id.slice(0, 8)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Follow-up discipline */}
          <Card className="rounded-xl border" style={{ borderColor: 'hsl(var(--color-border))' }}>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: 'hsl(var(--color-text-secondary))' }}>
                <CalendarCheck className="h-4 w-4" /> Disciplina de Follow-up
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-end gap-3 mb-2">
                <span className="text-3xl font-bold" style={{ color: 'hsl(var(--color-brand))' }}>
                  {followUpMetrics.rate}%
                </span>
                <span className="text-xs mb-1" style={{ color: 'hsl(var(--color-text-muted))' }}>
                  {followUpMetrics.completed}/{followUpMetrics.scheduled} concluídos
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--color-bg-subtle))' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(followUpMetrics.rate, 100)}%`,
                    background: followUpMetrics.rate >= 70 ? 'hsl(var(--color-urgent-ok))' : followUpMetrics.rate >= 40 ? 'hsl(var(--color-urgent-medium))' : 'hsl(var(--color-urgent-critical))',
                  }}
                />
              </div>
              {followUpMetrics.overdue > 0 && (
                <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'hsl(var(--color-urgent-critical))' }}>
                  <AlertTriangle className="h-3 w-3" /> {followUpMetrics.overdue} atrasado(s)
                </p>
              )}
            </CardContent>
          </Card>

          {/* Actions per day */}
          <Card className="rounded-xl border" style={{ borderColor: 'hsl(var(--color-border))' }}>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: 'hsl(var(--color-text-secondary))' }}>
                <TrendingUp className="h-4 w-4" /> Ações / Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <span className="text-3xl font-bold" style={{ color: 'hsl(var(--color-brand))' }}>
                {actionsPerDay}
              </span>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--color-text-muted))' }}>
                média nos últimos {periodDays} dias
              </p>
            </CardContent>
          </Card>

          {/* Aging summary */}
          <Card className="rounded-xl border" style={{ borderColor: 'hsl(var(--color-border))' }}>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: 'hsl(var(--color-text-secondary))' }}>
                <Clock className="h-4 w-4" /> Leads Envelhecendo
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold" style={{ color: agingLeads.length > 0 ? 'hsl(var(--color-urgent-critical))' : 'hsl(var(--color-urgent-ok))' }}>
                  {agingLeads.length}
                </span>
                <span className="text-xs mb-1" style={{ color: 'hsl(var(--color-text-muted))' }}>
                  leads acima do SLA
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-[10px]" style={{ borderColor: 'hsl(var(--color-urgent-critical))', color: 'hsl(var(--color-urgent-critical))' }}>
                  {agingLeads.filter(a => a.severity === "critical").length} críticos
                </Badge>
                <Badge variant="outline" className="text-[10px]" style={{ borderColor: 'hsl(var(--color-urgent-medium))', color: 'hsl(var(--color-urgent-medium))' }}>
                  {agingLeads.filter(a => a.severity === "warning").length} atenção
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Actions Chart */}
        <Card className="rounded-xl border" style={{ borderColor: 'hsl(var(--color-border))' }}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium" style={{ color: 'hsl(var(--color-text-secondary))' }}>
              Ações Diárias por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyActions} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => format(parseISO(v), "dd/MM")}
                  />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(v) => format(parseISO(v as string), "dd 'de' MMM", { locale: ptBR })}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                    <Bar key={cat} dataKey={cat} stackId="a" fill={color} radius={[0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Aging Leads Table */}
        <Card className="rounded-xl border" style={{ borderColor: 'hsl(var(--color-border))' }}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium" style={{ color: 'hsl(var(--color-text-secondary))' }}>
              Leads Envelhecendo — Acima do SLA
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 md:px-4 pb-4">
            {agingLeads.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2" style={{ color: 'hsl(var(--color-urgent-ok))' }} />
                <p className="text-sm" style={{ color: 'hsl(var(--color-text-muted))' }}>
                  Todos os leads estão dentro do SLA! 🎉
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'hsl(var(--color-border))' }}>
                      <th className="text-left py-2 px-2 text-xs font-medium" style={{ color: 'hsl(var(--color-text-muted))' }}>Lead</th>
                      <th className="text-left py-2 px-2 text-xs font-medium hidden md:table-cell" style={{ color: 'hsl(var(--color-text-muted))' }}>Empresa</th>
                      <th className="text-left py-2 px-2 text-xs font-medium" style={{ color: 'hsl(var(--color-text-muted))' }}>Estágio</th>
                      <th className="text-center py-2 px-2 text-xs font-medium" style={{ color: 'hsl(var(--color-text-muted))' }}>Dias</th>
                      <th className="text-left py-2 px-2 text-xs font-medium hidden md:table-cell" style={{ color: 'hsl(var(--color-text-muted))' }}>Responsável</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agingLeads.map(lead => (
                      <tr
                        key={lead.id}
                        className="border-b cursor-pointer hover:bg-gray-50 transition-colors"
                        style={{ borderColor: 'hsl(var(--color-border))' }}
                        onClick={() => setSelectedLeadId(lead.id)}
                      >
                        <td className="py-2 px-2">
                          <span className="font-medium text-xs" style={{ color: 'hsl(var(--color-text-primary))' }}>{lead.name}</span>
                        </td>
                        <td className="py-2 px-2 hidden md:table-cell">
                          <span className="text-xs" style={{ color: 'hsl(var(--color-text-muted))' }}>{lead.company || "—"}</span>
                        </td>
                        <td className="py-2 px-2">
                          <Badge variant="outline" className="text-[10px]">{lead.stageLabel}</Badge>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <Badge
                            className="text-[10px] font-bold"
                            style={{
                              background: lead.severity === "critical" ? 'hsl(var(--color-urgent-critical))' : 'hsl(var(--color-urgent-medium))',
                              color: 'white',
                              border: 'none',
                            }}
                          >
                            {lead.daysInStage}d
                          </Badge>
                        </td>
                        <td className="py-2 px-2 hidden md:table-cell">
                          <span className="text-xs" style={{ color: 'hsl(var(--color-text-muted))' }}>{lead.assignedName || "—"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Follow-ups */}
        {followUpMetrics.overdueList.length > 0 && (
          <Card className="rounded-xl border" style={{ borderColor: 'hsl(var(--color-urgent-critical))', borderWidth: 1 }}>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: 'hsl(var(--color-urgent-critical))' }}>
                <AlertTriangle className="h-4 w-4" /> Follow-ups Atrasados
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {followUpMetrics.overdueList.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedLeadId(f.leadId)}
                  >
                    <div>
                      <span className="text-xs font-medium" style={{ color: 'hsl(var(--color-text-primary))' }}>{f.leadName}</span>
                      {f.company && <span className="text-[10px] ml-1.5" style={{ color: 'hsl(var(--color-text-muted))' }}>· {f.company}</span>}
                      {f.note && <p className="text-[10px]" style={{ color: 'hsl(var(--color-text-muted))' }}>{f.note}</p>}
                    </div>
                    <Badge variant="outline" className="text-[10px]" style={{ borderColor: 'hsl(var(--color-urgent-critical))', color: 'hsl(var(--color-urgent-critical))' }}>
                      {f.dueDate}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Lead Drawer — reuse existing */}
      {selectedLeadId && (
        <LeadDrawerWrapper leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
      )}
    </div>
  );
};

// Wrapper to fetch lead data for drawer
function LeadDrawerWrapper({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const [lead, setLead] = useState<any>(null);
  const [open, setOpen] = useState(true);

  useState(() => {
    (async () => {
      const { data } = await (await import("@/integrations/supabase/client")).supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();
      if (data) setLead(data);
    })();
  });

  if (!lead) return null;

  return (
    <LeadDrawer
      lead={lead}
      open={open}
      onOpenChange={(v) => { setOpen(v); if (!v) onClose(); }}
      userId=""
      onLeadUpdated={() => {}}
    />
  );
}

export default PerformanceDashboard;

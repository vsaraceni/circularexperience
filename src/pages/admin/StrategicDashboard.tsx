import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  CheckCircle2,
  Briefcase,
  Phone,
  ArrowLeft,
  Settings,
  Target,
  DollarSign,
  Hash,
  Percent,
} from "lucide-react";
import CrmNavbar from "@/components/admin/CrmNavbar";
import { useStrategicDashboard, type CampaignKPI, type Campaign, type CampaignGoals } from "@/hooks/useStrategicDashboard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";


const StrategicDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
    const {
    loading,
    sdrMetrics,
    closerMetrics,
    funnelData,
    dailyActions,
    activeCampaign,
    campaigns,
    campaignKPIs,
    campaignLeads,
    refetch,
  } = useStrategicDashboard();

  const [showCampaignDialog, setShowCampaignDialog] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const daysRemaining = activeCampaign
    ? Math.max(0, differenceInDays(new Date(activeCampaign.ends_at), new Date()))
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <CrmNavbar currentModule="painel" />

      <main className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
        {/* Campaign Banner */}
        {activeCampaign ? (
          <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-4 sm:p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Target className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-foreground">{activeCampaign.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(activeCampaign.starts_at), "dd MMM", { locale: ptBR })} — {format(new Date(activeCampaign.ends_at), "dd MMM yyyy", { locale: ptBR })}
                    {" · "}{campaignLeads.length} leads no período
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{daysRemaining}</p>
                  <p className="text-xs text-muted-foreground">dias restantes</p>
                </div>
                {isAdmin && (
                  <Button variant="ghost" size="icon" onClick={() => setShowCampaignDialog(true)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-muted-foreground/30 p-6 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhuma campanha ativa</p>
            {isAdmin && (
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowCampaignDialog(true)}>
                Criar Campanha
              </Button>
            )}
          </div>
        )}

        {/* Campaign KPI Cards */}
        {campaignKPIs.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {campaignKPIs.map((kpi) => (
              <KPICard key={kpi.key} kpi={kpi} />
            ))}
          </div>
        )}

        {/* Pipeline Cards */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Pipeline
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {STAGES_META.map((stage) => {
              const count = (pipelineCounts[stage.key] || []).length;
              const health = stageHealth[stage.key];
              const hasLeads = health && health.total > 0;
              const healthPct = hasLeads ? Math.round((health.healthy / health.total) * 100) : 0;
              const hasCritical = health && health.critical > 0;

              return (
                <Card
                  key={stage.key}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    hasCritical ? "border-destructive/50 shadow-destructive/10" : ""
                  }`}
                  onClick={() => navigate(`/admin/pipeline?stage=${stage.key}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg">{stage.icon}</span>
                      <span className="text-2xl font-bold text-foreground">{count}</span>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground truncate mb-2">
                      {stage.label}
                    </p>
                    {hasLeads ? (
                      <div className="flex items-center gap-1.5">
                        <Progress value={healthPct} className="h-1.5 flex-1" />
                        <span
                          className={`text-[10px] font-medium ${
                            healthPct >= 80 ? "text-green-600" : healthPct >= 50 ? "text-amber-500" : "text-destructive"
                          }`}
                        >
                          {healthPct}%
                        </span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground text-center">—</p>
                    )}
                    {health && (health.warning > 0 || health.critical > 0) && (
                      <div className="flex gap-1 mt-1.5">
                        {health.warning > 0 && <span className="text-[10px] text-amber-500">⚠️{health.warning}</span>}
                        {health.critical > 0 && <span className="text-[10px] text-destructive">🔴{health.critical}</span>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* SDR + Closer panels (50/50) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SDR Panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-4 w-4 text-secondary" />
                SDR
                {sdrMetrics.profiles.map((p) => (
                  <Badge key={p.id} variant="secondary" className="text-[10px] ml-1">
                    {p.badge_initials || p.full_name?.charAt(0) || "?"}
                  </Badge>
                ))}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <MiniMetric label="Leads" value={sdrMetrics.totalLeads} />
                <MiniMetric label="SLA OK" value={`${sdrMetrics.slaCompliance}%`} color={sdrMetrics.slaCompliance >= 80 ? "green" : "red"} />
                <MiniMetric label="Ativação" value={`${sdrMetrics.activationRate}%`} color={sdrMetrics.activationRate >= 60 ? "green" : "amber"} />
                <MiniMetric label="Protocolo BV" value={`${sdrMetrics.protocolRate}%`} color={sdrMetrics.protocolRate >= 80 ? "green" : "amber"} />
              </div>
            </CardContent>
          </Card>

          {/* Closer Panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-accent" />
                Closer
                {closerMetrics.profiles.map((p) => (
                  <Badge key={p.id} variant="outline" className="text-[10px] ml-1 border-accent text-accent-foreground">
                    {p.badge_initials || p.full_name?.charAt(0) || "?"}
                  </Badge>
                ))}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <MiniMetric label="Leads" value={closerMetrics.totalLeads} />
                <MiniMetric label="Fechados" value={closerMetrics.closed} />
                <MiniMetric label="Conversão" value={`${closerMetrics.conversionRate}%`} color={closerMetrics.conversionRate >= 30 ? "green" : "amber"} />
                <MiniMetric label="Pipeline" value={`R$ ${(closerMetrics.pipelineValue / 1000).toFixed(0)}k`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Funnel + Daily Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Funil de Conversão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {funnelData.map((item, i) => {
                  const maxReached = Math.max(...funnelData.map((f) => f.reached), 1);
                  const barWidth = Math.max((item.reached / maxReached) * 100, 8);
                  return (
                    <div key={item.stage} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-20 text-right truncate">{item.label}</span>
                      <div className="flex-1 relative">
                        <div
                          className="h-7 rounded-md flex items-center px-2 transition-all"
                          style={{ width: `${barWidth}%`, background: `hsl(var(--primary) / ${0.15 + (i * 0.12)})` }}
                        >
                          <span className="text-xs font-semibold text-foreground">{item.reached}</span>
                        </div>
                      </div>
                      {i > 0 ? (
                        <span className={`text-xs font-medium w-12 text-right ${item.conversionRate >= 60 ? "text-green-600" : item.conversionRate >= 30 ? "text-amber-500" : "text-destructive"}`}>
                          {item.conversionRate}%
                        </span>
                      ) : (
                        <span className="w-12" />
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3">% = taxa de conversão da etapa anterior → atual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-secondary" />
                Ações do Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailyActions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  Nenhuma ação pendente! 🎉
                </div>
              ) : (
                <div className="space-y-3">
                  {dailyActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => navigate("/admin/pipeline")}
                      className="w-full text-left flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-lg mt-0.5">{action.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{action.text}</p>
                      </div>
                      <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180 mt-1" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Campaign Management Dialog */}
      <CampaignDialog
        open={showCampaignDialog}
        onOpenChange={setShowCampaignDialog}
        campaigns={campaigns}
        onSaved={refetch}
      />
    </div>
  );
};

// ---- KPI Card ----

const KPICard = ({ kpi }: { kpi: CampaignKPI }) => {
  const progressColor = kpi.pct >= 80 ? "text-green-600" : kpi.pct >= 50 ? "text-amber-500" : "text-destructive";
  const barColor = kpi.pct >= 80 ? "bg-green-500" : kpi.pct >= 50 ? "bg-amber-500" : "bg-destructive";

  const formatValue = (val: number, unit: string) => {
    if (unit === "currency") return `R$ ${(val / 1000).toFixed(0)}k`;
    if (unit === "pct") return `${val}%`;
    return String(val);
  };

  const IconComp = kpi.unit === "currency" ? DollarSign : kpi.unit === "count" ? Hash : Percent;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <IconComp className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground truncate">{kpi.label}</p>
        </div>
        <p className="text-xl font-bold text-foreground mb-1">
          {formatValue(kpi.current, kpi.unit)}
          <span className="text-xs font-normal text-muted-foreground ml-1">
            / {formatValue(kpi.target, kpi.unit)}
          </span>
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${Math.min(kpi.pct, 100)}%` }}
            />
          </div>
          <span className={`text-xs font-semibold ${progressColor}`}>{kpi.pct}%</span>
        </div>
      </CardContent>
    </Card>
  );
};

// ---- Campaign Dialog ----

const DEFAULT_GOALS: CampaignGoals = {
  em_contato_pct: 40,
  agendamentos_pct: 50,
  propostas_pct: 60,
  deals_count: 5,
  deals_value: 100000,
};

const CampaignDialog = ({
  open,
  onOpenChange,
  campaigns,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  campaigns: Campaign[];
  onSaved: () => void;
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [goals, setGoals] = useState<CampaignGoals>(DEFAULT_GOALS);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setStartsAt("");
    setEndsAt("");
    setGoals(DEFAULT_GOALS);
  };

  const editCampaign = (c: Campaign) => {
    setEditingId(c.id);
    setName(c.name);
    setStartsAt(c.starts_at);
    setEndsAt(c.ends_at);
    setGoals(c.goals);
  };

  const handleSave = async () => {
    if (!name || !startsAt || !endsAt) {
      toast.error("Preencha nome e datas");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("campaigns")
          .update({ name, starts_at: startsAt, ends_at: endsAt, goals: goals as any })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Campanha atualizada");
      } else {
        const { error } = await supabase
          .from("campaigns")
          .insert({ name, starts_at: startsAt, ends_at: endsAt, goals: goals as any });
        if (error) throw error;
        toast.success("Campanha criada");
      }
      resetForm();
      onSaved();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Campaign) => {
    const { error } = await supabase
      .from("campaigns")
      .update({ is_active: !c.is_active })
      .eq("id", c.id);
    if (error) {
      toast.error("Erro ao alterar status");
    } else {
      toast.success(c.is_active ? "Campanha desativada" : "Campanha ativada");
      onSaved();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Gerenciar Campanhas
          </DialogTitle>
        </DialogHeader>

        {/* Existing campaigns */}
        {campaigns.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Campanhas</p>
            {campaigns.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(c.starts_at), "dd/MM")} — {format(new Date(c.ends_at), "dd/MM/yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Badge variant={c.is_active ? "default" : "secondary"} className="cursor-pointer text-[10px]" onClick={() => toggleActive(c)}>
                    {c.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => editCampaign(c)}>Editar</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            {editingId ? "Editar Campanha" : "Nova Campanha"}
          </p>
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Campanha Mês do Meio Ambiente" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Início</Label>
              <Input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div>
              <Label>Fim</Label>
              <Input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
          </div>
          <p className="text-xs font-semibold text-muted-foreground uppercase mt-2">Metas</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Em Contato (%)</Label>
              <Input type="number" value={goals.em_contato_pct} onChange={(e) => setGoals({ ...goals, em_contato_pct: Number(e.target.value) })} />
            </div>
            <div>
              <Label className="text-xs">Agendamentos (%)</Label>
              <Input type="number" value={goals.agendamentos_pct} onChange={(e) => setGoals({ ...goals, agendamentos_pct: Number(e.target.value) })} />
            </div>
            <div>
              <Label className="text-xs">Propostas (%)</Label>
              <Input type="number" value={goals.propostas_pct} onChange={(e) => setGoals({ ...goals, propostas_pct: Number(e.target.value) })} />
            </div>
            <div>
              <Label className="text-xs">Deals (qtd)</Label>
              <Input type="number" value={goals.deals_count} onChange={(e) => setGoals({ ...goals, deals_count: Number(e.target.value) })} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Receita Meta (R$)</Label>
              <Input type="number" value={goals.deals_value} onChange={(e) => setGoals({ ...goals, deals_value: Number(e.target.value) })} />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {editingId && (
            <Button variant="ghost" onClick={resetForm}>Cancelar edição</Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : editingId ? "Atualizar" : "Criar Campanha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ---- Sub-components ----

const MiniMetric = ({ label, value, color }: { label: string; value: string | number; color?: "green" | "amber" | "red" }) => {
  const colorClass = color === "green" ? "text-green-600" : color === "red" ? "text-destructive" : color === "amber" ? "text-amber-500" : "text-foreground";
  return (
    <div className="bg-muted/50 rounded-lg p-2.5 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-bold ${colorClass}`}>{value}</p>
    </div>
  );
};

export default StrategicDashboard;

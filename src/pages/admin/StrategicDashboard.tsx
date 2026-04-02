import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Activity,
  AlertTriangle,
  Zap,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  Phone,
} from "lucide-react";
import { LogoImage } from "@/components/LogoImage";
import logo from "@/assets/movimento-circular-logo.png";
import { useStrategicDashboard, type DashboardAlert } from "@/hooks/useStrategicDashboard";

const STAGES_META = [
  { key: "novo", label: "Novo", icon: "🆕" },
  { key: "boas_vindas", label: "Boas-Vindas", icon: "👋" },
  { key: "em_contato", label: "Em Contato", icon: "💬" },
  { key: "call_agendada", label: "Call", icon: "📞" },
  { key: "proposta", label: "Proposta", icon: "📄" },
  { key: "nutricao", label: "Nutrição", icon: "🌱" },
  { key: "fechado", label: "Fechado", icon: "🎉" },
];

const StrategicDashboard = () => {
  const navigate = useNavigate();
  const {
    loading,
    healthScore,
    stageHealth,
    velocity7d,
    activitiesToday,
    pipelineTotal,
    alerts,
    pipelineCounts,
    sdrMetrics,
    closerMetrics,
    leads,
  } = useStrategicDashboard();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const criticalAlerts = alerts.filter((a) => a.severity === "critical").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-40">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <LogoImage src={logo} alt="Movimento Circular" className="h-9 brightness-0 invert" />
            <span className="text-lg font-bold">Painel Estratégico</span>
          </div>
          <div className="flex items-center gap-6">
            {/* Health Score Ring */}
            <div className="flex items-center gap-2">
              <HealthRing score={healthScore} size={40} />
              <div className="text-xs leading-tight">
                <div className="font-semibold">Health</div>
                <div className="opacity-80">{healthScore}%</div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="hidden md:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <span className="font-medium">{velocity7d}</span>
                <span className="opacity-70 text-xs">fechados/7d</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                <span className="font-medium">{activitiesToday}</span>
                <span className="opacity-70 text-xs">ações hoje</span>
              </div>
              {criticalAlerts > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {criticalAlerts} alertas
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate("/admin/propostas")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Pipeline
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
        {/* Pipeline Cards */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Pipeline
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {STAGES_META.map((stage) => {
              const count = (pipelineCounts[stage.key] || []).length;
              const health = stageHealth[stage.key];
              const healthPct = health && health.total > 0 ? Math.round((health.healthy / health.total) * 100) : 100;
              const hasCritical = health && health.critical > 0;

              return (
                <Card
                  key={stage.key}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    hasCritical ? "border-destructive/50 shadow-destructive/10" : ""
                  }`}
                  onClick={() => navigate(`/admin/propostas?stage=${stage.key}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg">{stage.icon}</span>
                      <span className="text-2xl font-bold text-foreground">{count}</span>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground truncate mb-2">
                      {stage.label}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Progress value={healthPct} className="h-1.5 flex-1" />
                      <span
                        className={`text-[10px] font-medium ${
                          healthPct >= 80
                            ? "text-green-600"
                            : healthPct >= 50
                            ? "text-amber-500"
                            : "text-destructive"
                        }`}
                      >
                        {healthPct}%
                      </span>
                    </div>
                    {health && (health.warning > 0 || health.critical > 0) && (
                      <div className="flex gap-1 mt-1.5">
                        {health.warning > 0 && (
                          <span className="text-[10px] text-amber-500">⚠️{health.warning}</span>
                        )}
                        {health.critical > 0 && (
                          <span className="text-[10px] text-destructive">🔴{health.critical}</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Summary bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={Users}
            label="Leads Ativos"
            value={leads.filter((l) => l.kanban_stage !== "fechado").length}
          />
          <MetricCard
            icon={DollarSign}
            label="Pipeline Total"
            value={`R$ ${pipelineTotal.toLocaleString("pt-BR")}`}
          />
          <MetricCard
            icon={TrendingUp}
            label="Fechados 7d"
            value={velocity7d}
          />
          <MetricCard
            icon={AlertTriangle}
            label="Alertas"
            value={alerts.length}
            highlight={criticalAlerts > 0}
          />
        </div>

        {/* Alerts + Team panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alerts column */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Alertas ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  Tudo em dia! 🎉
                </div>
              ) : (
                alerts.slice(0, 15).map((alert, i) => (
                  <AlertRow key={i} alert={alert} onClick={() => navigate("/admin/propostas")} />
                ))
              )}
            </CardContent>
          </Card>

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
              {sdrMetrics.slaCompliance < 80 && (
                <p className="text-xs text-destructive font-medium">
                  ⚡ Priorizar leads com SLA crítico
                </p>
              )}
              {sdrMetrics.protocolRate < 100 && (
                <p className="text-xs text-amber-600 font-medium">
                  📋 Completar protocolos de boas-vindas pendentes
                </p>
              )}
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
              {closerMetrics.conversionRate < 20 && closerMetrics.totalLeads > 0 && (
                <p className="text-xs text-amber-600 font-medium">
                  📊 Taxa de conversão abaixo da meta
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

// ---- Sub-components ----

const HealthRing = ({ score, size }: { score: number; size: number }) => {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "hsl(140, 60%, 45%)" : score >= 50 ? "hsl(45, 100%, 50%)" : "hsl(0, 65%, 55%)";

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsla(0,0%,100%,0.2)" strokeWidth={3} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  );
};

const MetricCard = ({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: any;
  label: string;
  value: string | number;
  highlight?: boolean;
}) => (
  <Card className={highlight ? "border-destructive/50" : ""}>
    <CardContent className="pt-5 pb-4 px-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${highlight ? "bg-destructive/10" : "bg-primary/10"}`}>
          <Icon className={`h-5 w-5 ${highlight ? "text-destructive" : "text-primary"}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const AlertRow = ({ alert, onClick }: { alert: DashboardAlert; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full text-left flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
  >
    <span className="mt-0.5">
      {alert.severity === "critical" ? (
        <XCircle className="h-4 w-4 text-destructive" />
      ) : (
        <Clock className="h-4 w-4 text-amber-500" />
      )}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-foreground truncate">{alert.leadName}</p>
      <p className="text-xs text-muted-foreground">{alert.message}</p>
    </div>
  </button>
);

const MiniMetric = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: "green" | "amber" | "red";
}) => {
  const colorClass =
    color === "green"
      ? "text-green-600"
      : color === "red"
      ? "text-destructive"
      : color === "amber"
      ? "text-amber-500"
      : "text-foreground";

  return (
    <div className="bg-muted/50 rounded-lg p-2.5 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-bold ${colorClass}`}>{value}</p>
    </div>
  );
};

export default StrategicDashboard;

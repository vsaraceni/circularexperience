import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDailySnapshots, type PeriodFilter, type DailySnapshot } from "@/hooks/useDailySnapshots";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from "recharts";

const PERIODS: { label: string; value: PeriodFilter }[] = [
  { label: "7 dias", value: "7d" },
  { label: "14 dias", value: "14d" },
  { label: "30 dias", value: "30d" },
  { label: "Tudo", value: "all" },
];

const formatDate = (d: string) => {
  try { return format(parseISO(d), "dd/MM", { locale: ptBR }); } catch { return d; }
};

const formatCurrency = (v: number) => {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`;
  return `R$ ${v.toFixed(0)}`;
};

const ChartTooltipLabel = ({ label }: { label?: string }) => {
  if (!label) return null;
  try { return <span className="font-medium">{format(parseISO(label), "dd MMM yyyy", { locale: ptBR })}</span>; }
  catch { return <span>{label}</span>; }
};

const EvolutionCharts = () => {
  const { snapshots, loading, period, setPeriod } = useDailySnapshots();

  const avgLeadsNovos = useMemo(() => {
    if (!snapshots.length) return 0;
    return Math.round(snapshots.reduce((s, d) => s + d.leads_novos_dia, 0) / snapshots.length);
  }, [snapshots]);

  const avgAcoesSdr = useMemo(() => {
    if (!snapshots.length) return 0;
    return Math.round(snapshots.reduce((s, d) => s + d.acoes_sdr_dia, 0) / snapshots.length);
  }, [snapshots]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[260px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (snapshots.length < 2) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p className="text-sm">Os gráficos de evolução aparecerão a partir de amanhã.</p>
          <p className="text-xs mt-1">O sistema salva um snapshot do funil todo dia às 23:55.</p>
        </CardContent>
      </Card>
    );
  }

  const conversionData = snapshots.map((s) => ({
    snapshot_date: s.snapshot_date,
    "Novo→BV": s.conv_novo_bv,
    "BV→Contato": s.conv_bv_contato,
    "Contato→Call": s.conv_contato_call,
    "Call→Proposta": s.conv_call_proposta,
    "Proposta→Nutrição": s.conv_proposta_nutricao,
    "Nutrição→Fechado": s.conv_nutricao_fechado,
  }));

  const convLines = [
    { key: "Novo→BV", color: "#2FB2C0" },
    { key: "BV→Contato", color: "#F4A736" },
    { key: "Contato→Call", color: "#5F2558" },
    { key: "Call→Proposta", color: "#EB626D" },
    { key: "Proposta→Nutrição", color: "#999999" },
    { key: "Nutrição→Fechado", color: "#4CAF50" },
  ];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Period filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Período:</span>
        {PERIODS.map((p) => (
          <Button
            key={p.value}
            variant={period === p.value ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Leads novos / dia */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Leads novos / dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={snapshots}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="snapshot_date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(l) => { try { return format(parseISO(l), "dd MMM yyyy", { locale: ptBR }); } catch { return l; } }}
                    formatter={(v: number) => [`${v} leads (média: ${avgLeadsNovos})`, "Novos"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <ReferenceLine y={avgLeadsNovos} stroke="#999" strokeDasharray="5 5" label={{ value: `Média: ${avgLeadsNovos}`, position: "right", fontSize: 10, fill: "#999" }} />
                  <Bar dataKey="leads_novos_dia" fill="#2FB2C0" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 2. Pipeline acumulado */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Pipeline acumulado (R$)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={snapshots}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="snapshot_date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={(l) => { try { return format(parseISO(l), "dd MMM yyyy", { locale: ptBR }); } catch { return l; } }}
                    formatter={(v: number) => [formatCurrency(v), "Pipeline"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Area type="monotone" dataKey="pipeline_value" stroke="#5F2558" fill="#5F2558" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 3. % Em Contato */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">% Em Contato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={snapshots}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="snapshot_date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={(l) => { try { return format(parseISO(l), "dd MMM yyyy", { locale: ptBR }); } catch { return l; } }}
                    formatter={(v: number) => [`${v}%`, "% Em Contato"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <ReferenceLine y={75} stroke="#999" strokeDasharray="5 5" label={{ value: "Meta: 75%", position: "right", fontSize: 10, fill: "#999" }} />
                  <Area type="monotone" dataKey="pct_em_contato" stroke="#2FB2C0" fill="#2FB2C0" fillOpacity={0.08} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 4. % Agendamentos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">% Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={snapshots}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="snapshot_date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={(l) => { try { return format(parseISO(l), "dd MMM yyyy", { locale: ptBR }); } catch { return l; } }}
                    formatter={(v: number) => [`${v}%`, "% Agendamentos"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <ReferenceLine y={70} stroke="#999" strokeDasharray="5 5" label={{ value: "Meta: 70%", position: "right", fontSize: 10, fill: "#999" }} />
                  <Area type="monotone" dataKey="pct_agendamentos" stroke="#F4A736" fill="#F4A736" fillOpacity={0.08} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 5. Ações SDR / dia */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Ações SDR / dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={snapshots}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="snapshot_date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(l) => { try { return format(parseISO(l), "dd MMM yyyy", { locale: ptBR }); } catch { return l; } }}
                    formatter={(v: number) => [`${v} ações (média: ${avgAcoesSdr})`, "Ações SDR"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <ReferenceLine y={avgAcoesSdr} stroke="#999" strokeDasharray="5 5" label={{ value: `Média: ${avgAcoesSdr}`, position: "right", fontSize: 10, fill: "#999" }} />
                  <Bar dataKey="acoes_sdr_dia" fill="#2FB2C0" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 6. Conversão inter-etapa (14d rolante) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Conversão inter-etapa (14d rolante)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={conversionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="snapshot_date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={(l) => { try { return format(parseISO(l), "dd MMM yyyy", { locale: ptBR }); } catch { return l; } }}
                    formatter={(v: number | null, name: string) => [v !== null ? `${v}%` : "—", name]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 10 }}
                    iconSize={8}
                  />
                  {convLines.map((cl) => (
                    <Line
                      key={cl.key}
                      type="monotone"
                      dataKey={cl.key}
                      stroke={cl.color}
                      strokeWidth={1.5}
                      dot={false}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EvolutionCharts;

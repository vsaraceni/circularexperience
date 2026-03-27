import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Target, Send, TrendingUp, DollarSign } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, FunnelChart, Funnel, LabelList } from "recharts";
import logo from "@/assets/movimento-circular-logo.png";
import { LogoImage } from "@/components/LogoImage";

const STAGES = [
  { key: "novo", label: "Novo" },
  { key: "boas_vindas", label: "Boas-Vindas" },
  { key: "em_contato", label: "Em Contato" },
  { key: "call_agendada", label: "Call Agendada" },
  { key: "proposta", label: "Proposta" },
  { key: "nutricao", label: "Nutrição" },
  { key: "fechado", label: "Fechado" },
];

const LOSS_REASONS = [
  "Sem resposta",
  "Preço fora do orçamento",
  "Escolheu outro fornecedor",
  "Projeto cancelado ou adiado",
  "Sem fit com o produto",
  "Timing — pode voltar no futuro",
];

const STAGE_COLORS = [
  "hsl(307, 44%, 26%)",
  "hsl(174, 72%, 40%)",
  "hsl(45, 100%, 50%)",
  "hsl(220, 70%, 50%)",
  "hsl(280, 60%, 50%)",
  "hsl(340, 60%, 50%)",
  "hsl(140, 60%, 40%)",
];

const PIE_COLORS = [
  "hsl(307, 44%, 26%)",
  "hsl(174, 72%, 40%)",
  "hsl(45, 100%, 50%)",
  "hsl(220, 70%, 50%)",
  "hsl(280, 60%, 50%)",
  "hsl(340, 60%, 50%)",
  "hsl(30, 80%, 55%)",
  "hsl(140, 60%, 40%)",
];

interface Lead {
  id: string;
  name: string;
  company: string | null;
  kanban_stage: string;
  status: string;
  origem: string;
  assigned_to: string | null;
  lost_reason: string | null;
  created_at: string | null;
  closed_at: string | null;
}

interface Proposal {
  id: string;
  investment: string | null;
  lead_id: string | null;
  status: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [submissions, setSubmissions] = useState<{ id: string }[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; full_name: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterOwner, setFilterOwner] = useState("all");
  const [filterOrigem, setFilterOrigem] = useState("all");

  useEffect(() => {
    const fetchAll = async () => {
      const [leadsRes, proposalsRes, subsRes, profilesRes] = await Promise.all([
        supabase.from("leads").select("id, name, company, kanban_stage, status, origem, assigned_to, lost_reason, created_at, closed_at").neq("status", "archived"),
        supabase.from("proposals").select("id, investment, lead_id, status"),
        supabase.from("proposal_submissions").select("id"),
        supabase.from("profiles").select("id, full_name"),
      ]);
      if (leadsRes.data) setLeads(leadsRes.data);
      if (proposalsRes.data) setProposals(proposalsRes.data);
      if (subsRes.data) setSubmissions(subsRes.data);
      if (profilesRes.data) setProfiles(profilesRes.data);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const filteredLeads = useMemo(() => {
    let result = leads;
    if (filterPeriod !== "all") {
      const days = parseInt(filterPeriod);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      result = result.filter((l) => l.created_at && new Date(l.created_at) >= cutoff);
    }
    if (filterOwner !== "all") {
      result = result.filter((l) => l.assigned_to === filterOwner);
    }
    if (filterOrigem !== "all") {
      result = result.filter((l) => l.origem === filterOrigem);
    }
    return result;
  }, [leads, filterPeriod, filterOwner, filterOrigem]);

  const activeLeads = filteredLeads.filter((l) => l.status !== "lost");
  const openLeads = activeLeads.filter((l) => l.kanban_stage !== "fechado");
  const closedLeads = activeLeads.filter((l) => l.kanban_stage === "fechado");
  const lostLeads = filteredLeads.filter((l) => l.status === "lost");
  const conversionRate = filteredLeads.length > 0 ? ((closedLeads.length / filteredLeads.length) * 100).toFixed(1) : "0";

  const pipelineTotal = useMemo(() => {
    const activeLeadIds = new Set(openLeads.map((l) => l.id));
    return proposals
      .filter((p) => p.lead_id && activeLeadIds.has(p.lead_id))
      .reduce((sum, p) => {
        if (!p.investment) return sum;
        const nums = p.investment.match(/[\d.,]+/g);
        if (!nums) return sum;
        const val = parseFloat(nums[0].replace(/\./g, "").replace(",", "."));
        return sum + (isNaN(val) ? 0 : val);
      }, 0);
  }, [openLeads, proposals]);

  // Funnel data
  const funnelData = STAGES.map((s, i) => ({
    name: s.label,
    value: activeLeads.filter((l) => l.kanban_stage === s.key).length,
    fill: STAGE_COLORS[i],
  }));

  // Leads by source
  const sourceData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLeads.forEach((l) => {
      map[l.origem] = (map[l.origem] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredLeads]);

  // Loss by reason
  const lossData = useMemo(() => {
    const map: Record<string, number> = {};
    LOSS_REASONS.forEach((r) => (map[r] = 0));
    lostLeads.forEach((l) => {
      if (l.lost_reason && map[l.lost_reason] !== undefined) {
        map[l.lost_reason]++;
      }
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [lostLeads]);

  // Leads by owner
  const ownerData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLeads.forEach((l) => {
      const key = l.assigned_to || "sem_resp";
      map[key] = (map[key] || 0) + 1;
    });
    const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p.full_name || "Sem nome"]));
    return Object.entries(map).map(([id, value]) => ({
      name: id === "sem_resp" ? "Sem responsável" : profileMap[id] || "Desconhecido",
      value,
    }));
  }, [filteredLeads, profiles]);

  const uniqueOrigens = [...new Set(leads.map((l) => l.origem))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <LogoImage src={logo} alt="Movimento Circular" className="h-10" />
            <span className="text-lg font-bold text-foreground">Dashboard</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/propostas")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Pipeline
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterOwner} onValueChange={setFilterOwner}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.full_name || "Sem nome"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterOrigem} onValueChange={setFilterOrigem}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Fonte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas fontes</SelectItem>
              {uniqueOrigens.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <MetricCard icon={Users} label="Leads Total" value={filteredLeads.length} />
          <MetricCard icon={Target} label="Em Aberto" value={openLeads.length} />
          <MetricCard icon={Send} label="Propostas Enviadas" value={submissions.length} />
          <MetricCard icon={TrendingUp} label="Taxa Conversão" value={`${conversionRate}%`} />
          <MetricCard icon={DollarSign} label="Pipeline Total" value={`R$ ${pipelineTotal.toLocaleString("pt-BR")}`} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Funil de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(val: number) => [val, "Leads"]} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {funnelData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Leads by Source */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leads por Fonte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sourceData} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                      {sourceData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Loss by Reason */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Perda por Motivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lossData} margin={{ left: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} interval={0} />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(val: number) => [val, "Leads"]} />
                    <Bar dataKey="value" fill="hsl(0, 65%, 55%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Leads by Owner */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leads por Responsável</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ownerData} margin={{ left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" angle={-20} textAnchor="end" tick={{ fontSize: 12 }} interval={0} />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(val: number) => [val, "Leads"]} />
                    <Bar dataKey="value" fill="hsl(174, 72%, 40%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
  <Card>
    <CardContent className="pt-5 pb-4 px-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default Dashboard;

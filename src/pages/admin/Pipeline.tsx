import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Plus, Search, Eye, ArrowLeft, MoreVertical, AlertTriangle, ArrowDownAZ, Clock, SlidersHorizontal, ListChecks, Kanban } from "lucide-react";
import { getUrgencyLevel } from "@/components/admin/UrgencyBadge";
import { useAllPendingFollowUps } from "@/hooks/useFollowUps";
import { subDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Lead } from "@/components/admin/LeadList";
import KanbanBoard from "@/components/admin/KanbanBoard";
import MissionsBanner from "@/components/admin/MissionsBanner";
import LostLeadsView from "@/components/admin/LostLeadsView";
import PriorityListView from "@/components/admin/PriorityListView";
import ProposalForm from "@/components/admin/ProposalForm";
import CrmNavbar from "@/components/admin/CrmNavbar";
import DailyBriefing from "@/components/admin/DailyBriefing";

import type { Proposal } from "./Proposals";

interface AuthorDefaults {
  author_name: string;
  author_email: string;
  author_phone: string;
}

const Pipeline = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLost, setShowLost] = useState(false);
  const [authorDefaults, setAuthorDefaults] = useState<AuthorDefaults>({ author_name: "", author_email: "", author_phone: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOrigem, setFilterOrigem] = useState("all");
  const [filterOwner, setFilterOwner] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStages, setFilterStages] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; full_name: string | null }[]>([]);
  const { data: allPendingFollowUps = [] } = useAllPendingFollowUps();

  // Proposal form state (for generating proposal from kanban)
  const [showForm, setShowForm] = useState(false);
  const [prefill, setPrefill] = useState<{ company_name?: string; contact_name?: string; contact_role?: string; lead_id?: string } | undefined>();

  const followUpsByLead = useMemo(() => {
    const map: Record<string, { hasToday: boolean; hasOverdue: boolean; hasFuture: boolean }> = {};
    const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
    allPendingFollowUps.forEach(f => {
      const due = new Date(f.due_date + "T00:00:00");
      if (!map[f.lead_id]) map[f.lead_id] = { hasToday: false, hasOverdue: false, hasFuture: false };
      if (due < todayDate) map[f.lead_id].hasOverdue = true;
      else if (due.getTime() === todayDate.getTime()) map[f.lead_id].hasToday = true;
      else map[f.lead_id].hasFuture = true;
    });
    return map;
  }, [allPendingFollowUps]);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, cargo, phone")
      .eq("id", user.id)
      .single();
    if (data) {
      setAuthorDefaults({
        author_name: data.full_name || "",
        author_email: data.email || "",
        author_phone: (data as any).phone || "",
      });
    }
  }, [user]);

  const fetchLeads = async () => {
    const { data: allData, error: allError } = await supabase
      .from("leads")
      .select("*")
      .neq("status", "archived")
      .order("created_at", { ascending: false });
    if (!allError && allData) setAllLeads(allData as Lead[]);

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .not("status", "in", '("converted","archived")')
      .order("created_at", { ascending: false });
    if (!error) setLeads((data as Lead[]) || []);
  };

  const fetchProposals = async () => {
    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setProposals((data as Proposal[]) || []);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name");
    if (data) setProfiles(data);
  };

  useEffect(() => {
    Promise.all([fetchLeads(), fetchProposals(), fetchProfile(), fetchProfiles()]).then(() => setLoading(false));
  }, [fetchProfile]);

  const origens = useMemo(() => {
    const set = new Set(allLeads.map((l) => l.origem));
    return Array.from(set).sort();
  }, [allLeads]);

  const filteredLeads = useMemo(() => {
    let result = allLeads;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(term) ||
          (l.company || "").toLowerCase().includes(term) ||
          l.email.toLowerCase().includes(term)
      );
    }
    if (filterOrigem !== "all") result = result.filter((l) => l.origem === filterOrigem);
    if (filterOwner !== "all") {
      if (filterOwner === "unassigned") result = result.filter((l) => !l.assigned_to);
      else result = result.filter((l) => l.assigned_to === filterOwner);
    }
    if (filterPeriod !== "all") {
      const days = parseInt(filterPeriod, 10);
      const cutoff = subDays(new Date(), days);
      result = result.filter((l) => l.created_at && new Date(l.created_at) >= cutoff);
    }
    if (filterStatus === "vencidos") {
      result = result.filter((l) => getUrgencyLevel(l.kanban_stage, l.stage_updated_at || null, l.last_activity_at || null) === "critical");
    } else if (filterStatus === "atencao") {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const overdueFollowUpLeads = new Set(allPendingFollowUps.filter(f => new Date(f.due_date + "T00:00:00") < today).map(f => f.lead_id));
      const todayFollowUpLeads = new Set(allPendingFollowUps.filter(f => new Date(f.due_date + "T00:00:00").getTime() === today.getTime()).map(f => f.lead_id));
      const threeDaysFromNow = new Date(today); threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      const expiringProposalLeads = new Set(proposals.filter(p => p.valid_until && new Date(p.valid_until) <= threeDaysFromNow && p.lead_id).map(p => p.lead_id!));
      result = result.filter((l) =>
        getUrgencyLevel(l.kanban_stage, l.stage_updated_at || null, l.last_activity_at || null) === "critical" ||
        overdueFollowUpLeads.has(l.id) || todayFollowUpLeads.has(l.id) || expiringProposalLeads.has(l.id)
      );
    } else if (filterStatus === "no_prazo") {
      result = result.filter((l) => getUrgencyLevel(l.kanban_stage, l.stage_updated_at || null, l.last_activity_at || null) === "normal");
    }
    if (filterStages.length > 0) {
      result = result.filter((l) => filterStages.includes(l.kanban_stage));
    }
    return result;
  }, [allLeads, searchTerm, filterOrigem, filterOwner, filterPeriod, filterStatus, filterStages, allPendingFollowUps, proposals]);

  const handleGenerateProposal = (lead: Lead) => {
    setPrefill({
      company_name: lead.company,
      contact_name: lead.name,
      contact_role: lead.cargo,
      lead_id: lead.id,
    });
    setShowForm(true);
  };

  const handleSaveProposal = async (data: Partial<Proposal> & { lead_id?: string }) => {
    const leadId = data.lead_id;
    const saveData = { ...data };
    delete (saveData as any).lead_id;

    const slug = `prop-${crypto.randomUUID().slice(0, 8)}`;
    const insertData: any = { ...saveData, slug, created_by: user!.id };

    let finalLeadId = leadId;
    if (finalLeadId) {
      const { data: existingProp } = await supabase.from("proposals").select("id").eq("lead_id", finalLeadId).maybeSingle();
      if (existingProp) { toast.error("Este lead já possui uma proposta."); return; }
    }

    if (!finalLeadId) {
      const { data: newLead, error: leadError } = await supabase.from("leads").insert({
        name: saveData.contact_name || "", email: `manual-${slug}@noemail.com`,
        company: saveData.company_name || "", cargo: saveData.contact_role || "",
        origem: "manual", status: "converted", kanban_stage: "proposta",
        stage_updated_at: new Date().toISOString(), last_activity_at: new Date().toISOString(),
      }).select("id").single();
      if (!leadError && newLead) finalLeadId = newLead.id;
    }

    if (finalLeadId) insertData.lead_id = finalLeadId;

    const { error } = await supabase.from("proposals").insert(insertData);
    if (error) { toast.error("Erro ao criar proposta"); return; }

    if (finalLeadId) {
      const now = new Date().toISOString();
      await supabase.from("leads").update({ status: "converted", kanban_stage: "proposta", stage_updated_at: now, last_activity_at: now }).eq("id", finalLeadId);
      await supabase.from("lead_activities").insert({ lead_id: finalLeadId, user_id: user!.id, activity_type: "proposta_gerada", content: "Proposta gerada" });
    }

    toast.success("Proposta criada!");
    setShowForm(false);
    setPrefill(undefined);
    await Promise.all([fetchProposals(), fetchLeads()]);
  };

  const handleSendWelcomeFromKanban = async (lead: Lead) => {
    try {
      const { data, error } = await supabase.functions.invoke("send-welcome-email", {
        body: {
          lead_id: lead.id, name: lead.name, email: lead.email, company: lead.company,
          cargo: lead.cargo, sender_name: authorDefaults.author_name,
          sender_email: authorDefaults.author_email, sender_phone: authorDefaults.author_phone,
        },
      });
      if (error) throw error;
      if (data?.success) {
        const now = new Date().toISOString();
        await supabase.from("leads").update({ kanban_stage: "boas_vindas", stage_updated_at: now, last_activity_at: now, assigned_to: user!.id, assigned_at: now }).eq("id", lead.id);
        await supabase.from("lead_activities").insert({ lead_id: lead.id, user_id: user!.id, activity_type: "welcome_enviado", content: "E-mail de boas-vindas enviado" });
        toast.success("Welcome enviado!");
        fetchLeads();
      } else {
        throw new Error(data?.error || "Erro desconhecido");
      }
    } catch (err: any) {
      toast.error("Erro ao enviar welcome: " + (err.message || ""));
    }
  };

  const [sortMode, setSortMode] = useState<"urgency" | "arrival" | "stale">("urgency");
  const [searchFocused, setSearchFocused] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "priorities">(() => {
    try { return (localStorage.getItem("pipeline_view") as "kanban" | "priorities") || "kanban"; } catch { return "kanban"; }
  });
  const [prioritySortKey, setPrioritySortKey] = useState<"sla" | "oldest" | "newest" | "value" | "size">("sla");
  const activeFilterCount = [filterOrigem, filterOwner, filterPeriod, filterStatus].filter(v => v !== "all").length + filterStages.length;

  const toggleViewMode = (mode: "kanban" | "priorities") => {
    setViewMode(mode);
    try { localStorage.setItem("pipeline_view", mode); } catch {}
  };

  const PIPELINE_STAGES = [
    { id: "novo", label: "Novo" },
    { id: "boas_vindas", label: "Boas-Vindas" },
    { id: "em_contato", label: "Em Contato" },
    { id: "call_agendada", label: "Call Agendada" },
    { id: "proposta", label: "Proposta" },
    { id: "nutricao", label: "Nutrição" },
  ];

  const toggleStageFilter = (stageId: string) => {
    setFilterStages(prev => prev.includes(stageId) ? prev.filter(s => s !== stageId) : [...prev, stageId]);
  };

  if (showForm) {
    return (
      <div className="h-screen overflow-hidden flex flex-col" style={{ background: 'hsl(var(--color-bg-page))' }}>
        <CrmNavbar currentModule="pipeline" />
        <main className="flex-1 overflow-auto container px-4 max-w-5xl py-6">
          <ProposalForm
            proposal={null}
            onSave={handleSaveProposal}
            onCancel={() => { setShowForm(false); setPrefill(undefined); }}
            prefill={prefill}
            authorDefaults={authorDefaults}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ background: 'hsl(var(--color-bg-page))' }}>
      <CrmNavbar currentModule="pipeline" />
      {user && <DailyBriefing userId={user.id} />}

      {showLost ? (
        <main className="flex-1 overflow-auto px-6 py-5">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-[22px] font-bold" style={{ color: 'hsl(var(--color-text-primary))' }}>
              Leads Perdidos
            </h1>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-4 rounded-lg font-medium"
              style={{ borderColor: 'hsl(var(--color-brand))', color: 'hsl(var(--color-brand))' }}
              onClick={() => setShowLost(false)}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" aria-hidden="true" /> Voltar ao Pipeline
            </Button>
          </div>
          <LostLeadsView leads={allLeads} profiles={profiles} userId={user!.id} onLeadUpdated={fetchLeads} />
        </main>
      ) : loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'hsl(var(--color-brand))' }} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden px-2 md:px-4 pt-2">
          {/* Toolbar */}
          <div className="flex items-center gap-2 mb-2 shrink-0 flex-wrap">
            <MissionsBanner
              inline
              leads={filteredLeads}
              userId={user!.id}
              profiles={profiles}
              followUpsByLead={followUpsByLead}
              onScrollToStage={(stageId) => {
                const el = document.querySelector(`[data-stage-id="${stageId}"]`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                  el.classList.add("ring-2", "ring-offset-2");
                  el.setAttribute("style", `${el.getAttribute("style") || ""};--tw-ring-color: #2FB2C0`);
                  setTimeout(() => { el.classList.remove("ring-2", "ring-offset-2"); }, 2000);
                }
              }}
            />
            <div className="h-4 w-px hidden md:block" style={{ background: 'hsl(var(--color-border))' }} />

            {/* View mode toggle */}
            <div className="hidden md:flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid hsl(var(--color-border))' }}>
              <button
                onClick={() => toggleViewMode("kanban")}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium transition-all"
                style={{
                  background: viewMode === "kanban" ? 'hsl(var(--color-brand))' : 'transparent',
                  color: viewMode === "kanban" ? 'white' : 'hsl(var(--color-text-muted))',
                }}
              >
                <Kanban className="h-3 w-3" /> Kanban
              </button>
              <button
                onClick={() => toggleViewMode("priorities")}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium transition-all"
                style={{
                  background: viewMode === "priorities" ? 'hsl(var(--color-brand))' : 'transparent',
                  color: viewMode === "priorities" ? 'white' : 'hsl(var(--color-text-muted))',
                }}
              >
                <ListChecks className="h-3 w-3" /> Prioridades
              </button>
            </div>

            {/* Sort pills */}
            <div className="hidden md:flex items-center gap-1">
              {([
                { key: "urgency" as const, icon: <AlertTriangle className="h-3 w-3" />, label: "Urgência" },
                { key: "arrival" as const, icon: <ArrowDownAZ className="h-3 w-3" />, label: "Chegada" },
                { key: "stale" as const, icon: <Clock className="h-3 w-3" />, label: "Parados" },
              ]).map(pill => (
                <button
                  key={pill.key}
                  onClick={() => setSortMode(pill.key)}
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full transition-all"
                  style={{
                    background: sortMode === pill.key ? 'hsl(var(--color-brand))' : 'transparent',
                    color: sortMode === pill.key ? 'white' : 'hsl(var(--color-text-muted))',
                    border: sortMode === pill.key ? 'none' : '1px solid hsl(var(--color-border))',
                  }}
                >
                  {pill.icon} {pill.label}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            {/* Filter popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[10px] rounded-lg gap-1 relative"
                  style={{
                    borderColor: activeFilterCount > 0 ? 'hsl(var(--color-brand))' : 'hsl(var(--color-border))',
                    color: activeFilterCount > 0 ? 'hsl(var(--color-brand))' : 'hsl(var(--color-text-secondary))',
                    background: activeFilterCount > 0 ? 'hsl(var(--color-brand-light))' : 'white',
                  }}
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  <span className="hidden md:inline">Filtros</span>
                  {activeFilterCount > 0 && (
                    <span className="ml-0.5 h-4 min-w-[16px] rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: 'hsl(var(--color-brand))' }}>
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-3 space-y-2.5" align="end">
                <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(var(--color-text-primary))' }}>Filtros</p>
                <Select value={filterOrigem} onValueChange={setFilterOrigem}>
                  <SelectTrigger className="w-full h-8 rounded-lg text-xs"><SelectValue placeholder="Todas as origens" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as origens</SelectItem>
                    {origens.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={filterOwner} onValueChange={setFilterOwner}>
                  <SelectTrigger className="w-full h-8 rounded-lg text-xs"><SelectValue placeholder="Todos os responsáveis" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os responsáveis</SelectItem>
                    <SelectItem value="unassigned">Sem responsável</SelectItem>
                    {profiles.map((p) => (<SelectItem key={p.id} value={p.id}>{p.full_name || p.id.slice(0, 8)}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger className="w-full h-8 rounded-lg text-xs"><SelectValue placeholder="Todo o período" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo o período</SelectItem>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full h-8 rounded-lg text-xs"><SelectValue placeholder="Todos os status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="vencidos">Vencidos</SelectItem>
                    <SelectItem value="atencao">⚠ Atenção</SelectItem>
                    <SelectItem value="no_prazo">No prazo</SelectItem>
                  </SelectContent>
                </Select>
                <div>
                  <p className="text-[10px] font-medium mb-1" style={{ color: 'hsl(var(--color-text-secondary))' }}>Etapa do funil</p>
                  <div className="flex flex-wrap gap-1">
                    {PIPELINE_STAGES.map(s => (
                      <button
                        key={s.id}
                        onClick={() => toggleStageFilter(s.id)}
                        className="px-2 py-0.5 text-[10px] rounded-full transition-all"
                        style={{
                          background: filterStages.includes(s.id) ? 'hsl(var(--color-brand))' : 'hsl(var(--color-bg-page))',
                          color: filterStages.includes(s.id) ? 'white' : 'hsl(var(--color-text-secondary))',
                          border: `1px solid ${filterStages.includes(s.id) ? 'hsl(var(--color-brand))' : 'hsl(var(--color-border))'}`,
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                {viewMode === "priorities" && (
                  <Select value={prioritySortKey} onValueChange={(v) => setPrioritySortKey(v as any)}>
                    <SelectTrigger className="w-full h-8 rounded-lg text-xs"><SelectValue placeholder="Ordenação" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sla">SLA (padrão)</SelectItem>
                      <SelectItem value="oldest">Mais antigo</SelectItem>
                      <SelectItem value="newest">Mais recente</SelectItem>
                      <SelectItem value="value">Maior valor</SelectItem>
                      <SelectItem value="size">Maior empresa</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" className="w-full h-7 text-[10px]" style={{ color: 'hsl(var(--color-text-muted))' }}
                    onClick={() => { setFilterOrigem("all"); setFilterOwner("all"); setFilterPeriod("all"); setFilterStatus("all"); setFilterStages([]); }}
                  >
                    Limpar filtros
                  </Button>
                )}
              </PopoverContent>
            </Popover>

            {/* Collapsible search */}
            <div className="relative" style={{ width: searchFocused || searchTerm ? 180 : 32, transition: 'width 200ms ease' }}>
              <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 pointer-events-none" style={{ color: 'hsl(var(--color-text-muted))' }} />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="pl-7 h-7 rounded-lg text-[10px]"
                style={{ borderColor: 'hsl(var(--color-border))' }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-2 top-1.5 h-3.5 w-3.5 flex items-center justify-center" style={{ color: 'hsl(var(--color-text-muted))' }}>✕</button>
              )}
            </div>

            <div className="h-4 w-px hidden md:block" style={{ background: 'hsl(var(--color-border))' }} />

            {/* More menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-lg" style={{ borderColor: 'hsl(var(--color-border))', color: 'hsl(var(--color-text-secondary))' }}>
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowLost(true)}>
                  <Eye className="h-4 w-4 mr-2" /> Ver Leads Perdidos
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              className="h-7 px-2.5 rounded-lg font-medium text-[10px]"
              style={{ background: 'hsl(var(--color-brand))', color: 'white' }}
              onClick={() => { setPrefill(undefined); setShowForm(true); }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> <span className="hidden md:inline">Nova Proposta</span><span className="md:hidden">+</span>
            </Button>
          </div>

          {/* View content */}
          <div className="flex-1 overflow-hidden">
            {viewMode === "kanban" ? (
              <KanbanBoard
                leads={filteredLeads}
                userId={user!.id}
                proposals={proposals}
                profiles={profiles}
                sortMode={sortMode}
                onLeadUpdated={fetchLeads}
                onGenerateProposal={handleGenerateProposal}
                onSendWelcome={handleSendWelcomeFromKanban}
              />
            ) : (
              <PriorityListView
                leads={filteredLeads}
                userId={user!.id}
                profiles={profiles}
                proposals={proposals}
                sortKey={prioritySortKey}
                onLeadUpdated={fetchLeads}
                onGenerateProposal={handleGenerateProposal}
                onSendWelcome={handleSendWelcomeFromKanban}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Pipeline;

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, LogOut, LayoutGrid, List, Search, Eye, BarChart3, ArrowLeft, User, Mail, ExternalLink } from "lucide-react";
import { getUrgencyLevel } from "@/components/admin/UrgencyBadge";
import { useAllPendingFollowUps } from "@/hooks/useFollowUps";
import { subDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ProposalForm from "@/components/admin/ProposalForm";
import ProposalList from "@/components/admin/ProposalList";
import LeadList, { type Lead } from "@/components/admin/LeadList";
import KanbanBoard from "@/components/admin/KanbanBoard";
import ProfileEditor from "@/components/admin/ProfileEditor";
import EmailTemplateEditor from "@/components/admin/EmailTemplateEditor";
import LostLeadsView from "@/components/admin/LostLeadsView";
import NotificationBell from "@/components/admin/NotificationBell";
import logo from "@/assets/movimento-circular-logo.png";
import { LogoImage } from "@/components/LogoImage";

export interface Proposal {
  id: string;
  company_name: string;
  contact_name: string;
  contact_role: string;
  event_date: string | null;
  title: string;
  scope: string;
  investment: string;
  considerations: string;
  valid_until: string | null;
  slug: string;
  created_at: string;
  created_by: string;
  author_name: string;
  author_phone: string;
  author_email: string;
  status?: string;
  lead_id?: string;
}

interface AuthorDefaults {
  author_name: string;
  author_email: string;
  author_phone: string;
}

const Proposals = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [editing, setEditing] = useState<Proposal | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [prefill, setPrefill] = useState<{ company_name?: string; contact_name?: string; contact_role?: string; lead_id?: string } | undefined>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("rascunhos");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const [showLost, setShowLost] = useState(false);
  const [authorDefaults, setAuthorDefaults] = useState<AuthorDefaults>({ author_name: "", author_email: "", author_phone: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOrigem, setFilterOrigem] = useState("all");
  const [filterOwner, setFilterOwner] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [profiles, setProfiles] = useState<{ id: string; full_name: string | null }[]>([]);
  const { data: allPendingFollowUps = [] } = useAllPendingFollowUps();

  const userInitials = useMemo(() => {
    if (!authorDefaults.author_name) return "?";
    return authorDefaults.author_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  }, [authorDefaults.author_name]);

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

    if (!allError && allData) {
      setAllLeads(allData as Lead[]);
    }

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .not("status", "in", '("converted","archived")')
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching leads:", error);
    } else {
      setLeads((data as Lead[]) || []);
    }
  };

  const fetchProposals = async () => {
    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar propostas");
    } else {
      setProposals((data as Proposal[]) || []);
    }
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
    if (filterOrigem !== "all") {
      result = result.filter((l) => l.origem === filterOrigem);
    }
    if (filterOwner !== "all") {
      if (filterOwner === "unassigned") {
        result = result.filter((l) => !l.assigned_to);
      } else {
        result = result.filter((l) => l.assigned_to === filterOwner);
      }
    }
    if (filterPeriod !== "all") {
      const days = parseInt(filterPeriod, 10);
      const cutoff = subDays(new Date(), days);
      result = result.filter((l) => l.created_at && new Date(l.created_at) >= cutoff);
    }

    // Status filter replaces old filterOverdue and filterAttention
    if (filterStatus === "vencidos") {
      result = result.filter((l) =>
        getUrgencyLevel(l.kanban_stage, l.stage_updated_at || null, l.last_activity_at || null) === "critical"
      );
    } else if (filterStatus === "atencao") {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const overdueFollowUpLeads = new Set(
        allPendingFollowUps.filter(f => new Date(f.due_date + "T00:00:00") < today).map(f => f.lead_id)
      );
      const todayFollowUpLeads = new Set(
        allPendingFollowUps.filter(f => new Date(f.due_date + "T00:00:00").getTime() === today.getTime()).map(f => f.lead_id)
      );
      const threeDaysFromNow = new Date(today); threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      const expiringProposalLeads = new Set(
        proposals.filter(p => p.valid_until && new Date(p.valid_until) <= threeDaysFromNow && p.lead_id).map(p => p.lead_id!)
      );
      result = result.filter((l) =>
        getUrgencyLevel(l.kanban_stage, l.stage_updated_at || null, l.last_activity_at || null) === "critical" ||
        overdueFollowUpLeads.has(l.id) ||
        todayFollowUpLeads.has(l.id) ||
        expiringProposalLeads.has(l.id)
      );
    } else if (filterStatus === "no_prazo") {
      result = result.filter((l) =>
        getUrgencyLevel(l.kanban_stage, l.stage_updated_at || null, l.last_activity_at || null) === "normal"
      );
    }

    return result;
  }, [allLeads, searchTerm, filterOrigem, filterOwner, filterPeriod, filterStatus, allPendingFollowUps, proposals]);

  const handleSave = async (data: Partial<Proposal> & { lead_id?: string }) => {
    const leadId = data.lead_id;
    const saveData = { ...data };
    delete (saveData as any).lead_id;

    if (editing) {
      const { error } = await supabase
        .from("proposals")
        .update(saveData)
        .eq("id", editing.id);
      if (error) {
        toast.error("Erro ao atualizar proposta");
        return;
      }
      toast.success("Proposta atualizada!");
    } else {
      const slug = `prop-${crypto.randomUUID().slice(0, 8)}`;
      const insertData: any = { ...saveData, slug, created_by: user!.id };

      let finalLeadId = leadId;
      if (finalLeadId) {
        const { data: existingProp } = await supabase
          .from("proposals")
          .select("id")
          .eq("lead_id", finalLeadId)
          .maybeSingle();
        if (existingProp) {
          toast.error("Este lead já possui uma proposta.");
          return;
        }
      }

      if (!finalLeadId) {
        const { data: newLead, error: leadError } = await supabase
          .from("leads")
          .insert({
            name: saveData.contact_name || "",
            email: `manual-${slug}@noemail.com`,
            company: saveData.company_name || "",
            cargo: saveData.contact_role || "",
            origem: "manual",
            status: "converted",
            kanban_stage: "proposta",
            stage_updated_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        if (!leadError && newLead) {
          finalLeadId = newLead.id;
        }
      }

      if (finalLeadId) {
        insertData.lead_id = finalLeadId;
      }

      const { error } = await supabase
        .from("proposals")
        .insert(insertData);
      if (error) {
        toast.error("Erro ao criar proposta");
        console.error(error);
        return;
      }

      if (finalLeadId) {
        const now = new Date().toISOString();
        await supabase.from("leads").update({
          status: "converted",
          kanban_stage: "proposta",
          stage_updated_at: now,
          last_activity_at: now,
        }).eq("id", finalLeadId);
        await supabase.from("lead_activities").insert({
          lead_id: finalLeadId,
          user_id: user!.id,
          activity_type: "proposta_gerada",
          content: "Proposta gerada",
        });
      }

      toast.success("Proposta criada!");
    }
    setEditing(null);
    setShowForm(false);
    setPrefill(undefined);
    await Promise.all([fetchProposals(), fetchLeads()]);
    if (!editing) setActiveTab("rascunhos");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("proposals").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir proposta");
    } else {
      toast.success("Proposta excluída!");
      fetchProposals();
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase
      .from("proposals")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      const labels: Record<string, string> = { rascunho: "rascunho", enviada: "enviada", fechada: "fechada", perdida: "perdida" };
      toast.success(`Proposta marcada como ${labels[status] || status}`);
      fetchProposals();
    }
  };

  const handleGenerateProposal = (lead: Lead) => {
    setPrefill({
      company_name: lead.company,
      contact_name: lead.name,
      contact_role: lead.cargo,
      lead_id: lead.id,
    });
    setEditing(null);
    setShowForm(true);
  };

  const handleSendWelcomeFromKanban = async (lead: Lead) => {
    try {
      const { data, error } = await supabase.functions.invoke("send-welcome-email", {
        body: {
          lead_id: lead.id,
          name: lead.name,
          email: lead.email,
          company: lead.company,
          cargo: lead.cargo,
          sender_name: authorDefaults.author_name,
          sender_email: authorDefaults.author_email,
          sender_phone: authorDefaults.author_phone,
        },
      });
      if (error) throw error;
      if (data?.success) {
        const now = new Date().toISOString();
        await supabase.from("leads").update({
          kanban_stage: "boas_vindas",
          stage_updated_at: now,
          last_activity_at: now,
          assigned_to: user!.id,
          assigned_at: now,
        }).eq("id", lead.id);
        await supabase.from("lead_activities").insert({
          lead_id: lead.id,
          user_id: user!.id,
          activity_type: "welcome_enviado",
          content: "E-mail de boas-vindas enviado",
        });
        toast.success("Welcome enviado!");
        fetchLeads();
      } else {
        throw new Error(data?.error || "Erro desconhecido");
      }
    } catch (err: any) {
      toast.error("Erro ao enviar welcome: " + (err.message || ""));
    }
  };

  const proposalsByStatus = (status: string) =>
    proposals.filter((p) => (p.status || "rascunho") === status);

  const isFilterActive = (filter: string, value: string) => value !== "all";

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--color-bg-page))' }}>
      {/* ===== NAVBAR — 3 ZONES ===== */}
      <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: 'hsl(var(--color-border))', height: 56 }}>
        <div className="w-full px-6 flex items-center justify-between h-14">
          {/* Zone Left — Logo + CRM + View Toggle */}
          <div className="flex items-center gap-3">
            <LogoImage src={logo} alt="Movimento Circular" className="h-8" />
            <span className="text-sm font-medium" style={{ color: 'hsl(var(--color-text-muted))' }}>CRM</span>
            <div className="flex items-center rounded-md overflow-hidden ml-2" style={{ background: 'hsl(var(--color-bg-subtle))', border: '1px solid hsl(var(--color-border))' }}>
              <button
                onClick={() => setViewMode("kanban")}
                className="h-8 w-8 flex items-center justify-center transition-all"
                style={{
                  background: viewMode === "kanban" ? 'hsl(var(--color-brand))' : 'transparent',
                  color: viewMode === "kanban" ? 'white' : 'hsl(var(--color-text-muted))',
                  borderRadius: 6,
                }}
                aria-label="Visualização Kanban"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className="h-8 w-8 flex items-center justify-center transition-all"
                style={{
                  background: viewMode === "list" ? 'hsl(var(--color-brand))' : 'transparent',
                  color: viewMode === "list" ? 'white' : 'hsl(var(--color-text-muted))',
                  borderRadius: 6,
                }}
                aria-label="Visualização Lista"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Zone Center — Dashboard */}
          <div className="flex items-center">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-gray-100"
              style={{ color: 'hsl(var(--color-text-secondary))' }}
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </button>
          </div>

          {/* Zone Right — Notifications + Account */}
          <div className="flex items-center gap-2">
            {user && <NotificationBell userId={user.id} />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none" aria-label="Menu da conta">
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarFallback
                      className="text-xs font-semibold"
                      style={{ background: 'hsl(var(--color-brand-light))', color: 'hsl(var(--color-brand))' }}
                    >
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl p-2 shadow-lg bg-white border" style={{ borderColor: 'hsl(var(--color-border))' }}>
                {user && (
                  <div className="[&>button]:w-full [&>button]:justify-start [&>button]:gap-2 [&>button]:rounded-lg [&>button]:px-2 [&>button]:py-1.5 [&>button]:text-sm [&>button]:font-normal">
                    <ProfileEditor userId={user.id} onProfileUpdated={fetchProfile} />
                  </div>
                )}
                <div className="[&>button]:w-full [&>button]:justify-start [&>button]:gap-2 [&>button]:rounded-lg [&>button]:px-2 [&>button]:py-1.5 [&>button]:text-sm [&>button]:font-normal">
                  <EmailTemplateEditor />
                </div>
                <DropdownMenuItem onClick={() => navigate("/")} className="gap-2 cursor-pointer rounded-lg">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" /> Ir para o Site
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="gap-2 cursor-pointer rounded-lg text-destructive">
                  <LogOut className="h-4 w-4" aria-hidden="true" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className={`mx-auto py-6 ${viewMode === "kanban" ? "px-6" : "container px-4 max-w-5xl"}`}>
        {showForm || editing ? (
          <ProposalForm
            proposal={editing}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null); setPrefill(undefined); }}
            prefill={prefill}
            authorDefaults={!editing ? authorDefaults : undefined}
          />
        ) : (
          <>
            {/* ===== PAGE HEADER ===== */}
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-[22px] font-bold" style={{ color: 'hsl(var(--color-text-primary))' }}>
                {showLost ? "Leads Perdidos" : viewMode === "list" ? "Propostas" : "Pipeline Comercial"}
              </h1>
              <div className="flex items-center gap-2">
                {viewMode === "kanban" && !showLost && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-4 rounded-lg font-medium"
                    style={{ borderColor: 'hsl(var(--color-brand))', color: 'hsl(var(--color-brand))' }}
                    onClick={() => setShowLost(true)}
                  >
                    <Eye className="h-4 w-4 mr-1.5" aria-hidden="true" /> Ver Perdidos
                  </Button>
                )}
                {showLost && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-4 rounded-lg font-medium"
                    style={{ borderColor: 'hsl(var(--color-brand))', color: 'hsl(var(--color-brand))' }}
                    onClick={() => setShowLost(false)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" aria-hidden="true" /> Voltar ao Pipeline
                  </Button>
                )}
                {!showLost && (
                  <Button
                    size="sm"
                    className="h-9 px-4 rounded-lg font-medium"
                    style={{ background: 'hsl(var(--color-brand))', color: 'white' }}
                    onClick={() => { setPrefill(undefined); setShowForm(true); }}
                  >
                    <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" /> Nova Proposta
                  </Button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'hsl(var(--color-brand))' }} />
              </div>
            ) : showLost ? (
              <LostLeadsView
                leads={allLeads}
                profiles={profiles}
                userId={user!.id}
                onLeadUpdated={fetchLeads}
              />
            ) : viewMode === "kanban" ? (
              <>
                {/* ===== FILTERS BAR ===== */}
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <div className="relative flex-1 min-w-[200px] max-w-[320px]">
                    <Search className="absolute left-3 top-2.5 h-4 w-4" style={{ color: 'hsl(var(--color-text-muted))' }} aria-hidden="true" />
                    <Input
                      placeholder="Buscar por nome, empresa, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-9 rounded-lg text-sm"
                      style={{ borderColor: 'hsl(var(--color-border))' }}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-2.5 h-4 w-4 flex items-center justify-center"
                        style={{ color: 'hsl(var(--color-text-muted))' }}
                        aria-label="Limpar busca"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <Select value={filterOrigem} onValueChange={setFilterOrigem}>
                    <SelectTrigger
                      className="w-[150px] h-9 rounded-lg text-sm"
                      style={{
                        borderColor: filterOrigem !== "all" ? 'hsl(var(--color-brand))' : 'hsl(var(--color-border))',
                        color: filterOrigem !== "all" ? 'hsl(var(--color-brand))' : 'hsl(var(--color-text-primary))',
                        background: filterOrigem !== "all" ? 'hsl(var(--color-brand-light))' : 'white',
                      }}
                    >
                      <SelectValue placeholder="Todas as origens" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as origens</SelectItem>
                      {origens.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterOwner} onValueChange={setFilterOwner}>
                    <SelectTrigger
                      className="w-[160px] h-9 rounded-lg text-sm"
                      style={{
                        borderColor: filterOwner !== "all" ? 'hsl(var(--color-brand))' : 'hsl(var(--color-border))',
                        color: filterOwner !== "all" ? 'hsl(var(--color-brand))' : 'hsl(var(--color-text-primary))',
                        background: filterOwner !== "all" ? 'hsl(var(--color-brand-light))' : 'white',
                      }}
                    >
                      <SelectValue placeholder="Responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="unassigned">Sem responsável</SelectItem>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name || p.id.slice(0, 8)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger
                      className="w-[150px] h-9 rounded-lg text-sm"
                      style={{
                        borderColor: filterPeriod !== "all" ? 'hsl(var(--color-brand))' : 'hsl(var(--color-border))',
                        color: filterPeriod !== "all" ? 'hsl(var(--color-brand))' : 'hsl(var(--color-text-primary))',
                        background: filterPeriod !== "all" ? 'hsl(var(--color-brand-light))' : 'white',
                      }}
                    >
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="7">Últimos 7 dias</SelectItem>
                      <SelectItem value="30">Últimos 30 dias</SelectItem>
                      <SelectItem value="90">Últimos 90 dias</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger
                      className="w-[140px] h-9 rounded-lg text-sm"
                      style={{
                        borderColor: filterStatus !== "all" ? 'hsl(var(--color-brand))' : 'hsl(var(--color-border))',
                        color: filterStatus !== "all" ? 'hsl(var(--color-brand))' : 'hsl(var(--color-text-primary))',
                        background: filterStatus !== "all" ? 'hsl(var(--color-brand-light))' : 'white',
                      }}
                    >
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="vencidos">Vencidos</SelectItem>
                      <SelectItem value="atencao">⚠ Atenção</SelectItem>
                      <SelectItem value="no_prazo">No prazo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <KanbanBoard
                  leads={filteredLeads}
                  userId={user!.id}
                  proposals={proposals}
                  profiles={profiles}
                  onLeadUpdated={fetchLeads}
                  onGenerateProposal={handleGenerateProposal}
                  onSendWelcome={handleSendWelcomeFromKanban}
                />
              </>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="rascunhos">
                    Rascunhos {proposalsByStatus("rascunho").length > 0 && `(${proposalsByStatus("rascunho").length})`}
                  </TabsTrigger>
                  <TabsTrigger value="enviadas">
                    Enviadas {proposalsByStatus("enviada").length > 0 && `(${proposalsByStatus("enviada").length})`}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="rascunhos">
                  <ProposalList
                    proposals={proposalsByStatus("rascunho")}
                    onEdit={(p) => setEditing(p)}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    statusFilter="rascunho"
                  />
                </TabsContent>

                <TabsContent value="enviadas">
                  <ProposalList
                    proposals={proposalsByStatus("enviada")}
                    onEdit={(p) => setEditing(p)}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    statusFilter="enviada"
                  />
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Proposals;

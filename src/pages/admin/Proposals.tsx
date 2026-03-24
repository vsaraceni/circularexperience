import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, LogOut, ArrowLeft, LayoutGrid, List, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProposalForm from "@/components/admin/ProposalForm";
import ProposalList from "@/components/admin/ProposalList";
import LeadList, { type Lead } from "@/components/admin/LeadList";
import KanbanBoard from "@/components/admin/KanbanBoard";
import ProfileEditor from "@/components/admin/ProfileEditor";
import EmailTemplateEditor from "@/components/admin/EmailTemplateEditor";
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
  const [activeTab, setActiveTab] = useState("leads");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const [authorDefaults, setAuthorDefaults] = useState<AuthorDefaults>({ author_name: "", author_email: "", author_phone: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOrigem, setFilterOrigem] = useState("all");
  const [filterOwner, setFilterOwner] = useState("all");
  const [profiles, setProfiles] = useState<{ id: string; full_name: string | null }[]>([]);

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
    // Fetch ALL leads for Kanban
    const { data: allData, error: allError } = await supabase
      .from("leads")
      .select("*")
      .neq("status", "archived")
      .order("created_at", { ascending: false });

    if (!allError && allData) {
      setAllLeads(allData as Lead[]);
    }

    // Filtered leads for list view (exclude converted/archived)
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
      result = result.filter((l) => l.assigned_to === filterOwner);
    }
    return result;
  }, [allLeads, searchTerm, filterOrigem, filterOwner]);

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

      // Check if lead already has a proposal
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

      // Auto-create lead if none provided
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

      // Mark lead as converted + update kanban
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <LogoImage src={logo} alt="Movimento Circular" className="h-10" />
            <span className="text-lg font-bold text-foreground">CRM</span>
          </div>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "kanban" ? "default" : "ghost"}
                size="sm"
                className="rounded-none h-8 px-3"
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className="rounded-none h-8 px-3"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            {user && <ProfileEditor userId={user.id} onProfileUpdated={fetchProfile} />}
            <EmailTemplateEditor />
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Site
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className={`mx-auto py-8 ${viewMode === "kanban" ? "px-4" : "container px-4 max-w-5xl"}`}>
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
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-foreground">Pipeline Comercial</h1>
              <Button onClick={() => { setPrefill(undefined); setShowForm(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Nova Proposta
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : viewMode === "kanban" ? (
              <>
                {/* Filters */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar nome, empresa, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  <Select value={filterOrigem} onValueChange={setFilterOrigem}>
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue placeholder="Origem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas origens</SelectItem>
                      {origens.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterOwner} onValueChange={setFilterOwner}>
                    <SelectTrigger className="w-[160px] h-9">
                      <SelectValue placeholder="Responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name || p.id.slice(0, 8)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <KanbanBoard
                  leads={filteredLeads}
                  userId={user!.id}
                  proposals={proposals}
                  onLeadUpdated={fetchLeads}
                  onGenerateProposal={handleGenerateProposal}
                  onSendWelcome={handleSendWelcomeFromKanban}
                />
              </>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-5">
                  <TabsTrigger value="leads">
                    Leads {leads.length > 0 && `(${leads.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="rascunhos">
                    Rascunhos {proposalsByStatus("rascunho").length > 0 && `(${proposalsByStatus("rascunho").length})`}
                  </TabsTrigger>
                  <TabsTrigger value="enviadas">
                    Enviadas {proposalsByStatus("enviada").length > 0 && `(${proposalsByStatus("enviada").length})`}
                  </TabsTrigger>
                  <TabsTrigger value="fechadas">
                    Fechadas {proposalsByStatus("fechada").length > 0 && `(${proposalsByStatus("fechada").length})`}
                  </TabsTrigger>
                  <TabsTrigger value="perdidas">
                    Perdidas {proposalsByStatus("perdida").length > 0 && `(${proposalsByStatus("perdida").length})`}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="leads">
                  <LeadList leads={leads} onGenerateProposal={handleGenerateProposal} onLeadUpdated={fetchLeads} authorDefaults={authorDefaults} />
                </TabsContent>

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

                <TabsContent value="fechadas">
                  <ProposalList
                    proposals={proposalsByStatus("fechada")}
                    onEdit={(p) => setEditing(p)}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    statusFilter="fechada"
                  />
                </TabsContent>

                <TabsContent value="perdidas">
                  <ProposalList
                    proposals={proposalsByStatus("perdida")}
                    onEdit={(p) => setEditing(p)}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    statusFilter="perdida"
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

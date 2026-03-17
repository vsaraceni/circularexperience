import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, LogOut, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProposalForm from "@/components/admin/ProposalForm";
import ProposalList from "@/components/admin/ProposalList";
import LeadList, { type Lead } from "@/components/admin/LeadList";
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
  const [editing, setEditing] = useState<Proposal | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [prefill, setPrefill] = useState<{ company_name?: string; contact_name?: string; contact_role?: string; lead_id?: string } | undefined>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("leads");
  const [authorDefaults, setAuthorDefaults] = useState<AuthorDefaults>({ author_name: "", author_email: "", author_phone: "" });

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
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("status", "new")
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

  useEffect(() => {
    Promise.all([fetchLeads(), fetchProposals(), fetchProfile()]).then(() => setLoading(false));
  }, [fetchProfile]);

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
      if (leadId) {
        insertData.lead_id = leadId;
      }
      const { error } = await supabase
        .from("proposals")
        .insert(insertData);
      if (error) {
        toast.error("Erro ao criar proposta");
        console.error(error);
        return;
      }

      // Mark lead as converted
      if (leadId) {
        await supabase.from("leads").update({ status: "converted" }).eq("id", leadId);
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
            {user && <ProfileEditor userId={user.id} onProfileUpdated={fetchProfile} />}
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Site
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
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
                  <LeadList leads={leads} onGenerateProposal={handleGenerateProposal} />
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

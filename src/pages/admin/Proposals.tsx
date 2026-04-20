import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import ProposalForm from "@/components/admin/ProposalForm";
import ProposalList from "@/components/admin/ProposalList";
import CrmNavbar from "@/components/admin/CrmNavbar";

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
  product_id?: string | null;
  master_asset_id?: string | null;
}

interface AuthorDefaults {
  author_name: string;
  author_email: string;
  author_phone: string;
}

const Proposals = () => {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [editing, setEditing] = useState<Proposal | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [prefill, setPrefill] = useState<{ company_name?: string; contact_name?: string; contact_role?: string; lead_id?: string } | undefined>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("rascunhos");
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

  const fetchProposals = async () => {
    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar propostas");
    else setProposals((data as Proposal[]) || []);
  };

  useEffect(() => {
    Promise.all([fetchProposals(), fetchProfile()]).then(() => setLoading(false));
  }, [fetchProfile]);

  const handleSave = async (data: Partial<Proposal> & { lead_id?: string }) => {
    const leadId = data.lead_id;
    const saveData = { ...data };
    delete (saveData as any).lead_id;

    if (editing) {
      const { error } = await supabase.from("proposals").update(saveData).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar proposta"); return; }
      toast.success("Proposta atualizada!");
    } else {
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
    }
    setEditing(null);
    setShowForm(false);
    setPrefill(undefined);
    await fetchProposals();
    if (!editing) setActiveTab("rascunhos");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("proposals").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir proposta");
    else { toast.success("Proposta excluída!"); fetchProposals(); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase.from("proposals").update({ status }).eq("id", id);
    if (error) toast.error("Erro ao atualizar status");
    else {
      const labels: Record<string, string> = { rascunho: "rascunho", enviada: "enviada", fechada: "fechada", perdida: "perdida" };
      toast.success(`Proposta marcada como ${labels[status] || status}`);
      fetchProposals();
    }
  };

  const proposalsByStatus = (status: string) => proposals.filter((p) => (p.status || "rascunho") === status);

  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ background: 'hsl(var(--color-bg-page))' }}>
      <CrmNavbar currentModule="propostas" />

      {showForm || editing ? (
        <main className="flex-1 overflow-auto container px-4 max-w-5xl py-6">
          <ProposalForm
            proposal={editing}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null); setPrefill(undefined); }}
            prefill={prefill}
            authorDefaults={!editing ? authorDefaults : undefined}
          />
        </main>
      ) : loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'hsl(var(--color-brand))' }} />
        </div>
      ) : (
        <main className="flex-1 overflow-auto container px-4 max-w-5xl py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold" style={{ color: 'hsl(var(--color-text-primary))' }}>Propostas</h1>
            <Button
              size="sm"
              className="h-9 px-4 rounded-lg font-medium"
              style={{ background: 'hsl(var(--color-brand))', color: 'white' }}
              onClick={() => { setPrefill(undefined); setShowForm(true); }}
            >
              <Plus className="h-4 w-4 mr-1.5" /> Nova Proposta
            </Button>
          </div>

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
        </main>
      )}
    </div>
  );
};

export default Proposals;

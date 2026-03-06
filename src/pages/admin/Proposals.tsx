import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, LogOut, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProposalForm from "@/components/admin/ProposalForm";
import ProposalList from "@/components/admin/ProposalList";
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
}

const Proposals = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [editing, setEditing] = useState<Proposal | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

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
    setLoading(false);
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleSave = async (data: Partial<Proposal>) => {
    if (editing) {
      const { error } = await supabase
        .from("proposals")
        .update(data)
        .eq("id", editing.id);
      if (error) {
        toast.error("Erro ao atualizar proposta");
        return;
      }
      toast.success("Proposta atualizada!");
    } else {
      const slug = `prop-${crypto.randomUUID().slice(0, 8)}`;
      const { error } = await supabase
        .from("proposals")
        .insert({ ...data, slug, created_by: user!.id } as any);
      if (error) {
        toast.error("Erro ao criar proposta");
        return;
      }
      toast.success("Proposta criada!");
    }
    setEditing(null);
    setShowForm(false);
    fetchProposals();
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <LogoImage src={logo} alt="Movimento Circular" className="h-10" />
            <span className="text-lg font-bold text-foreground">Propostas</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Site
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {showForm || editing ? (
          <ProposalForm
            proposal={editing}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-foreground">Propostas Comerciais</h1>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-1" /> Nova Proposta
              </Button>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <ProposalList
                proposals={proposals}
                onEdit={(p) => setEditing(p)}
                onDelete={handleDelete}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Proposals;

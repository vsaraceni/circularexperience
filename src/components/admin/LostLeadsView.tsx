import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RotateCcw, Trash2 } from "lucide-react";
import type { Lead } from "./LeadList";

interface LostLeadsViewProps {
  leads: Lead[];
  profiles: { id: string; full_name: string | null }[];
  userId: string;
  onLeadUpdated: () => void;
}

const LOST_REASONS = [
  "Sem resposta",
  "Preço fora do orçamento",
  "Escolheu outro fornecedor",
  "Projeto cancelado ou adiado",
  "Sem fit com o produto",
  "Timing — pode voltar no futuro",
];

const TEST_DOMAINS = ["@atinaedu.com.br", "@movimentocircular.io"];

const isTestLead = (email: string) =>
  TEST_DOMAINS.some((d) => email.toLowerCase().endsWith(d));

const LostLeadsView: React.FC<LostLeadsViewProps> = ({ leads, profiles, userId, onLeadUpdated }) => {
  const [filterReason, setFilterReason] = useState("all");
  const [reactivating, setReactivating] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);

  const lostLeads = useMemo(() => {
    let result = leads.filter((l) => l.kanban_stage === "perdido");
    if (filterReason !== "all") {
      result = result.filter((l) => l.lost_reason === filterReason);
    }
    return result;
  }, [leads, filterReason]);

  const handleReactivate = async (lead: Lead) => {
    setReactivating(lead.id);
    try {
      const now = new Date().toISOString();
      await supabase.from("leads").update({
        kanban_stage: "em_contato",
        lost_reason: null,
        lost_notes: null,
        stage_updated_at: now,
        last_activity_at: now,
      }).eq("id", lead.id);
      await supabase.from("lead_activities").insert({
        lead_id: lead.id,
        user_id: userId,
        activity_type: "lead_reativado",
        content: "Lead reativado — movido para Em Contato",
      });
      toast.success("Lead reativado!");
      onLeadUpdated();
    } catch (err: any) {
      toast.error("Erro ao reativar: " + (err.message || ""));
    } finally {
      setReactivating(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Delete related records first
      await supabase.from("lead_activities").delete().eq("lead_id", deleteTarget.id);
      await supabase.from("lead_follow_ups").delete().eq("lead_id", deleteTarget.id);
      await supabase.from("proposal_submissions").delete().eq("lead_id", deleteTarget.id);
      await supabase.from("notifications").delete().eq("lead_id", deleteTarget.id);
      // Delete the lead
      const { error } = await supabase.from("leads").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      toast.success("Lead de teste excluído!");
      onLeadUpdated();
    } catch (err: any) {
      toast.error("Erro ao excluir: " + (err.message || ""));
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const getProfileName = (id?: string | null) => {
    if (!id) return "—";
    return profiles.find((p) => p.id === id)?.full_name || "—";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={filterReason} onValueChange={setFilterReason}>
          <SelectTrigger className="w-[240px] h-9">
            <SelectValue placeholder="Filtrar por motivo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os motivos</SelectItem>
            {LOST_REASONS.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{lostLeads.length} lead(s) perdido(s)</span>
      </div>

      {lostLeads.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">Nenhum lead perdido encontrado.</p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead className="w-[140px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lostLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>{lead.company || "—"}</TableCell>
                  <TableCell>{getProfileName(lead.assigned_to)}</TableCell>
                  <TableCell>{lead.lost_reason || "—"}</TableCell>
                  <TableCell>
                    {lead.stage_updated_at
                      ? format(new Date(lead.stage_updated_at), "dd MMM yyyy", { locale: ptBR })
                      : "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{lead.lost_notes || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-xs"
                        disabled={reactivating === lead.id}
                        onClick={() => handleReactivate(lead)}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reativar
                      </Button>
                      {isTestLead(lead.email) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(lead)}
                          title="Excluir lead de teste"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir lead de teste?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Este lead parece ser de teste ({deleteTarget?.email}). A exclusão é permanente e removerá todas as atividades, follow-ups e notificações associadas.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LostLeadsView;

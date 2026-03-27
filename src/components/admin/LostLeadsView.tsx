import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RotateCcw } from "lucide-react";
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

const LostLeadsView: React.FC<LostLeadsViewProps> = ({ leads, profiles, userId, onLeadUpdated }) => {
  const [filterReason, setFilterReason] = useState("all");
  const [reactivating, setReactivating] = useState<string | null>(null);

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
                <TableHead className="w-[100px]"></TableHead>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default LostLeadsView;

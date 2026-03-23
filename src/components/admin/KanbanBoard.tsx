import { useState, useMemo } from "react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import KanbanColumn, { type KanbanStage } from "./KanbanColumn";
import LeadDrawer from "./LeadDrawer";
import LostDialog from "./LostDialog";
import type { Lead } from "./LeadList";

const STAGES: KanbanStage[] = [
  { id: "novo", label: "Novo", color: "hsl(var(--primary))" },
  { id: "boas_vindas", label: "Boas-Vindas", color: "#3b82f6" },
  { id: "em_contato", label: "Em Contato", color: "#8b5cf6" },
  { id: "call_agendada", label: "Call Agendada", color: "#f59e0b" },
  { id: "proposta", label: "Proposta", color: "#06b6d4" },
  { id: "nutricao", label: "Nutrição", color: "#ec4899" },
  { id: "fechado", label: "Fechado", color: "#22c55e" },
  { id: "perdido", label: "Perdido", color: "#ef4444" },
];

interface KanbanBoardProps {
  leads: Lead[];
  userId: string;
  onLeadUpdated: () => void;
  onGenerateProposal: (lead: Lead) => void;
  onSendWelcome: (lead: Lead) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads, userId, onLeadUpdated, onGenerateProposal, onSendWelcome,
}) => {
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lostLead, setLostLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const leadsByStage = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    STAGES.forEach((s) => (map[s.id] = []));
    leads.forEach((l) => {
      const stage = l.kanban_stage || "novo";
      if (map[stage]) map[stage].push(l);
      else map["novo"].push(l);
    });
    return map;
  }, [leads]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const newStage = over.id as string;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.kanban_stage === newStage) return;

    // Optimistic: will refetch after
    const oldStage = lead.kanban_stage;

    try {
      const now = new Date().toISOString();
      const updates: any = {
        kanban_stage: newStage,
        stage_updated_at: now,
        last_activity_at: now,
      };

      // Auto-assign if not assigned yet
      if (!lead.assigned_to) {
        updates.assigned_to = userId;
        updates.assigned_at = now;
      }

      if (newStage === "perdido") {
        // Open lost dialog instead
        setLostLead(lead);
        return;
      }

      if (newStage === "fechado") {
        updates.status = "converted";
      }

      const { error } = await supabase.from("leads").update(updates).eq("id", leadId);
      if (error) throw error;

      // Log activity
      await supabase.from("lead_activities").insert({
        lead_id: leadId,
        user_id: userId,
        activity_type: "stage_mudou",
        content: `Movido de ${STAGE_LABELS[oldStage]} para ${STAGE_LABELS[newStage]}`,
      });

      onLeadUpdated();
    } catch (err: any) {
      toast.error("Erro ao mover lead: " + (err.message || ""));
    }
  };

  const handleQuickAction = async (lead: Lead, action: string) => {
    const now = new Date().toISOString();

    switch (action) {
      case "send_welcome":
        onSendWelcome(lead);
        break;
      case "generate_proposal":
        onGenerateProposal(lead);
        break;
      case "linkedin":
        window.open(
          `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(`${lead.name} ${lead.company || ""}`.trim())}`,
          "_blank"
        );
        await supabase.from("leads").update({ linkedin_added: true, last_activity_at: now }).eq("id", lead.id);
        await supabase.from("lead_activities").insert({
          lead_id: lead.id, user_id: userId,
          activity_type: "linkedin_adicionado", content: "LinkedIn pesquisado",
        });
        onLeadUpdated();
        break;
      case "whatsapp":
        if (lead.telefone) {
          window.open(`https://wa.me/${lead.telefone.replace(/\D/g, "")}`, "_blank");
          await supabase.from("leads").update({ whatsapp_sent: true, last_activity_at: now }).eq("id", lead.id);
          await supabase.from("lead_activities").insert({
            lead_id: lead.id, user_id: userId,
            activity_type: "whatsapp_enviado", content: "WhatsApp enviado",
          });
          onLeadUpdated();
        } else {
          toast.error("Lead sem telefone cadastrado");
        }
        break;
      case "schedule_call":
        await supabase.from("leads").update({ kanban_stage: "call_agendada", stage_updated_at: now, last_activity_at: now }).eq("id", lead.id);
        await supabase.from("lead_activities").insert({
          lead_id: lead.id, user_id: userId,
          activity_type: "call_agendada", content: "Call agendada",
        });
        toast.success("Call agendada!");
        onLeadUpdated();
        break;
      case "call_done":
        await supabase.from("leads").update({ kanban_stage: "proposta", stage_updated_at: now, last_activity_at: now }).eq("id", lead.id);
        await supabase.from("lead_activities").insert({
          lead_id: lead.id, user_id: userId,
          activity_type: "call_realizada", content: "Call realizada",
        });
        toast.success("Call registrada!");
        onLeadUpdated();
        break;
      case "nurture":
        await supabase.from("leads").update({ kanban_stage: "nutricao", stage_updated_at: now, last_activity_at: now }).eq("id", lead.id);
        await supabase.from("lead_activities").insert({
          lead_id: lead.id, user_id: userId,
          activity_type: "stage_mudou", content: "Movido para Nutrição",
        });
        toast.success("Lead movido para Nutrição");
        onLeadUpdated();
        break;
      case "close_won":
        await supabase.from("leads").update({
          kanban_stage: "fechado", status: "converted", stage_updated_at: now, last_activity_at: now,
        }).eq("id", lead.id);
        await supabase.from("lead_activities").insert({
          lead_id: lead.id, user_id: userId,
          activity_type: "fechado", content: "Lead fechado com sucesso!",
        });
        toast.success("Lead fechado! 🎉");
        onLeadUpdated();
        break;
      case "mark_lost":
        setLostLead(lead);
        break;
    }
  };

  const handleLostConfirm = async (reason: string, notes: string) => {
    if (!lostLead) return;
    const now = new Date().toISOString();
    try {
      await supabase.from("leads").update({
        kanban_stage: "perdido", lost_reason: reason, lost_notes: notes,
        stage_updated_at: now, last_activity_at: now,
      }).eq("id", lostLead.id);
      await supabase.from("lead_activities").insert({
        lead_id: lostLead.id, user_id: userId,
        activity_type: "perdido", content: `Perdido: ${reason}${notes ? ` — ${notes}` : ""}`,
      });
      toast.success("Lead marcado como perdido");
      onLeadUpdated();
    } catch (err: any) {
      toast.error("Erro: " + (err.message || ""));
    } finally {
      setLostLead(null);
    }
  };

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              leads={leadsByStage[stage.id] || []}
              onOpenDrawer={(lead) => { setDrawerLead(lead); setDrawerOpen(true); }}
              onQuickAction={handleQuickAction}
            />
          ))}
        </div>
      </DndContext>

      <LeadDrawer
        lead={drawerLead}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onQuickAction={handleQuickAction}
      />

      <LostDialog
        open={!!lostLead}
        onOpenChange={(open) => !open && setLostLead(null)}
        onConfirm={handleLostConfirm}
        leadName={lostLead?.company || lostLead?.name || ""}
      />
    </>
  );
};

const STAGE_LABELS: Record<string, string> = {
  novo: "Novo",
  boas_vindas: "Boas-Vindas",
  em_contato: "Em Contato",
  call_agendada: "Call Agendada",
  proposta: "Proposta",
  nutricao: "Nutrição",
  fechado: "Fechado",
  perdido: "Perdido",
};

export default KanbanBoard;

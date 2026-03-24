import { useState, useMemo } from "react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowDownAZ, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
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

interface Proposal {
  id: string;
  lead_id?: string;
  investment: string;
}

interface KanbanBoardProps {
  leads: Lead[];
  userId: string;
  proposals: Proposal[];
  onLeadUpdated: () => void;
  onGenerateProposal: (lead: Lead) => void;
  onSendWelcome: (lead: Lead) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads, userId, proposals, onLeadUpdated, onGenerateProposal, onSendWelcome,
}) => {
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lostLead, setLostLead] = useState<Lead | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [sortMode, setSortMode] = useState<"arrival" | "stale">("arrival");

  const handleDragStart = (event: DragStartEvent) => {
    const lead = leads.find((l) => l.id === event.active.id);
    setActiveLead(lead || null);
  };

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
    // Sort each column
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => {
        if (sortMode === "stale") {
          const aTime = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
          const bTime = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;
          return aTime - bTime; // oldest activity first
        }
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return aTime - bTime; // oldest first
      });
    });
    return map;
  }, [leads, sortMode]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const newStage = over.id as string;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.kanban_stage === newStage) return;

    const oldStage = lead.kanban_stage;

    try {
      const now = new Date().toISOString();
      const updates: any = {
        kanban_stage: newStage,
        stage_updated_at: now,
        last_activity_at: now,
      };

      if (!lead.assigned_to) {
        updates.assigned_to = userId;
        updates.assigned_at = now;
      }

      if (newStage === "perdido") {
        setLostLead(lead);
        return;
      }

      if (newStage === "fechado") {
        updates.status = "converted";
      }

      const { error } = await supabase.from("leads").update(updates).eq("id", leadId);
      if (error) throw error;

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
      case "send_welcome": {
        const { data: freshLead } = await supabase.from("leads").select("welcome_sent").eq("id", lead.id).single();
        if (freshLead?.welcome_sent) {
          toast.info("E-mail de boas-vindas já foi enviado para este lead.");
          onLeadUpdated();
          return;
        }
        onSendWelcome(lead);
        break;
      }
      case "generate_proposal": {
        const { data: existingProp } = await supabase
          .from("proposals")
          .select("id")
          .eq("lead_id", lead.id)
          .maybeSingle();
        if (existingProp) {
          toast.info("Este lead já possui uma proposta.");
          return;
        }
        onGenerateProposal(lead);
        break;
      }
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
      case "copy_whatsapp":
        if (lead.telefone) {
          try {
            await navigator.clipboard.writeText(lead.telefone);
            toast.success("Telefone copiado!");
          } catch {
            toast.error("Erro ao copiar");
          }
          await supabase.from("leads").update({ whatsapp_sent: true, last_activity_at: now }).eq("id", lead.id);
          await supabase.from("lead_activities").insert({
            lead_id: lead.id, user_id: userId,
            activity_type: "whatsapp_enviado", content: "Telefone copiado para WhatsApp",
          });
          onLeadUpdated();
        } else {
          toast.error("Lead sem telefone cadastrado");
        }
        break;
      case "schedule_call": {
        // Open Google Calendar with pre-filled event
        const calendarUrl = new URL("https://calendar.google.com/calendar/render");
        calendarUrl.searchParams.set("action", "TEMPLATE");
        calendarUrl.searchParams.set("text", "Workshop imersivo Economia Circular");
        calendarUrl.searchParams.set("add", lead.email);
        calendarUrl.searchParams.set("details", `Call com ${lead.name} - ${lead.company || "Sem empresa"}`);
        window.open(calendarUrl.toString(), "_blank");

        await supabase.from("leads").update({ kanban_stage: "call_agendada", stage_updated_at: now, last_activity_at: now }).eq("id", lead.id);
        await supabase.from("lead_activities").insert({
          lead_id: lead.id, user_id: userId,
          activity_type: "call_agendada", content: "Call agendada via Google Calendar",
        });
        toast.success("Call agendada!");
        onLeadUpdated();
        break;
      }
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
    <TooltipProvider delayDuration={300}>
      {/* Sort toggle */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground">Ordenar:</span>
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <Button
            variant={sortMode === "arrival" ? "default" : "ghost"}
            size="sm"
            className="rounded-none h-7 px-2 text-xs gap-1"
            onClick={() => setSortMode("arrival")}
          >
            <ArrowDownAZ className="h-3 w-3" /> Chegada
          </Button>
          <Button
            variant={sortMode === "stale" ? "default" : "ghost"}
            size="sm"
            className="rounded-none h-7 px-2 text-xs gap-1"
            onClick={() => setSortMode("stale")}
          >
            <Clock className="h-3 w-3" /> Parados
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={(e) => { handleDragEnd(e); setActiveLead(null); }}>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
          {STAGES.map((stage) => {
            const stageLeads = leadsByStage[stage.id] || [];
            const stageLeadIds = new Set(stageLeads.map((l) => l.id));
            const stageProposals = proposals.filter((p) => p.lead_id && stageLeadIds.has(p.lead_id));
            return (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                leads={stageLeads}
                proposals={stageProposals}
                onOpenDrawer={(lead) => { setDrawerLead(lead); setDrawerOpen(true); }}
                onQuickAction={handleQuickAction}
              />
            );
          })}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeLead ? (
            <div className="bg-card border border-primary/40 rounded-lg p-3 shadow-xl opacity-90 w-[260px]">
              <h4 className="font-semibold text-sm text-foreground truncate">{activeLead.company || "Sem empresa"}</h4>
              <p className="text-xs text-muted-foreground truncate">{activeLead.name}</p>
            </div>
          ) : null}
        </DragOverlay>
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
    </TooltipProvider>
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

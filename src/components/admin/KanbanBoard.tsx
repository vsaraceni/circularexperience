import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowDownAZ, Clock, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { getUrgencyLevel } from "./UrgencyBadge";
import { TooltipProvider } from "@/components/ui/tooltip";
import KanbanColumn, { type KanbanStage } from "./KanbanColumn";
import LeadDrawer from "./LeadDrawer";
import LostDialog from "./LostDialog";
import SubmissionDialog from "./SubmissionDialog";
import ContactDialog from "./ContactDialog";
import { useAllPendingFollowUps } from "@/hooks/useFollowUps";
import type { Lead } from "./LeadList";

const STAGES: KanbanStage[] = [
  { id: "novo", label: "Novo", color: "hsl(0, 0%, 62%)" },
  { id: "boas_vindas", label: "Boas-Vindas", color: "hsl(210, 79%, 46%)" },
  { id: "em_contato", label: "Em Contato", color: "hsl(210, 79%, 46%)" },
  { id: "call_agendada", label: "Call Agendada", color: "hsl(307, 44%, 26%)" },
  { id: "proposta", label: "Proposta", color: "hsl(122, 39%, 39%)" },
  { id: "nutricao", label: "Nutrição", color: "hsl(27, 91%, 48%)" },
  { id: "fechado", label: "Fechado", color: "hsl(122, 48%, 34%)" },
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
  profiles?: { id: string; full_name: string | null }[];
  sortMode?: "urgency" | "arrival" | "stale";
  onLeadUpdated: () => void;
  onGenerateProposal: (lead: Lead) => void;
  onSendWelcome: (lead: Lead) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads, userId, proposals, profiles, sortMode = "urgency", onLeadUpdated, onGenerateProposal, onSendWelcome,
}) => {
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState("resumo");
  const [lostLead, setLostLead] = useState<Lead | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [submissionLead, setSubmissionLead] = useState<Lead | null>(null);
  const [contactLead, setContactLead] = useState<Lead | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { data: allPendingFollowUps = [] } = useAllPendingFollowUps();

  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    updateScrollState();
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateScrollState]);

  const scrollBy = useCallback((amount: number) => {
    scrollContainerRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollContainerRef.current;
    if (!el || Math.abs(e.deltaY) < 5) return;

    // Find the nearest scrollable column under the cursor
    let target = e.target as HTMLElement | null;
    let scrollableCol: HTMLElement | null = null;
    while (target && target !== el) {
      if (target.classList.contains('crm-scrollbar') && target.scrollHeight > target.clientHeight) {
        scrollableCol = target;
        break;
      }
      target = target.parentElement;
    }

    if (scrollableCol) {
      const { scrollTop, scrollHeight, clientHeight } = scrollableCol;
      const atTop = scrollTop <= 0 && e.deltaY < 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0;
      if (!atTop && !atBottom) {
        // Column can still scroll vertically — let native behavior handle it
        return;
      }
    }

    // No scrollable column or column at limit — scroll horizontally
    if (el.scrollWidth > el.clientWidth) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  }, []);

  const followUpsByLead = useMemo(() => {
    const map: Record<string, { hasToday: boolean; hasOverdue: boolean; hasFuture: boolean }> = {};
    const today = new Date(); today.setHours(0, 0, 0, 0);
    allPendingFollowUps.forEach(f => {
      const due = new Date(f.due_date + "T00:00:00");
      if (!map[f.lead_id]) map[f.lead_id] = { hasToday: false, hasOverdue: false, hasFuture: false };
      if (due < today) map[f.lead_id].hasOverdue = true;
      else if (due.getTime() === today.getTime()) map[f.lead_id].hasToday = true;
      else map[f.lead_id].hasFuture = true;
    });
    return map;
  }, [allPendingFollowUps]);

  const handleDragStart = (event: DragStartEvent) => {
    const lead = leads.find((l) => l.id === event.active.id);
    setActiveLead(lead || null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeLeads = useMemo(() => leads.filter((l) => l.kanban_stage !== "perdido"), [leads]);

  const leadsByStage = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    STAGES.forEach((s) => (map[s.id] = []));
    activeLeads.forEach((l) => {
      const stage = l.kanban_stage || "novo";
      if (map[stage]) map[stage].push(l);
      else map["novo"].push(l);
    });
    const URGENCY_ORDER = { critical: 0, warning: 1, normal: 2 };
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => {
        if (sortMode === "urgency") {
          const fuA = followUpsByLead[a.id];
          const fuB = followUpsByLead[b.id];
          const hasPendingA = fuA ? (fuA.hasToday || fuA.hasFuture) && !fuA.hasOverdue : false;
          const hasPendingB = fuB ? (fuB.hasToday || fuB.hasFuture) && !fuB.hasOverdue : false;
          const la = getUrgencyLevel(a.kanban_stage, a.stage_updated_at || null, a.last_activity_at || null, hasPendingA);
          const lb = getUrgencyLevel(b.kanban_stage, b.stage_updated_at || null, b.last_activity_at || null, hasPendingB);
          const diff = URGENCY_ORDER[la] - URGENCY_ORDER[lb];
          if (diff !== 0) return diff;
          const da = new Date(a.stage_updated_at || a.created_at || 0).getTime();
          const db = new Date(b.stage_updated_at || b.created_at || 0).getTime();
          return da - db;
        }
        if (sortMode === "stale") {
          const aTime = a.last_activity_at ? new Date(a.last_activity_at).getTime() : Date.now();
          const bTime = b.last_activity_at ? new Date(b.last_activity_at).getTime() : Date.now();
          return aTime - bTime;
        }
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });
    });
    return map;
  }, [activeLeads, sortMode, followUpsByLead]);

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

      if (newStage === "fechado") {
        updates.status = "converted";
        updates.closed_at = now;
      }

      const { error } = await supabase.from("leads").update(updates).eq("id", leadId);
      if (error) throw error;

      await supabase.from("lead_activities").insert({
        lead_id: leadId,
        user_id: userId,
        activity_type: "stage_mudou",
        content: `Movido de ${STAGE_LABELS[oldStage]} para ${STAGE_LABELS[newStage]}`,
        metadata: { from: oldStage, to: newStage },
      });

      // Send proposal alert email when moving to call_agendada (fire-and-forget)
      if (newStage === "call_agendada") {
        (async () => {
          try {
            const ownerId = lead.assigned_to || userId;
            const { data: ownerProfile } = await supabase.from("profiles").select("email").eq("id", ownerId).single();
            if (ownerProfile?.email) {
              supabase.functions.invoke("send-transactional-email", {
                body: {
                  templateName: "call-scheduled-alert",
                  recipientEmail: ownerProfile.email,
                  idempotencyKey: `call-alert-${leadId}-${Date.now()}`,
                  templateData: {
                    leadName: lead.name,
                    company: lead.company || '',
                    cargo: lead.cargo || '',
                    telefone: lead.telefone || '',
                    email: lead.email,
                    workEmail: lead.work_email || '',
                    briefingNotes: lead.briefing_notes || '',
                    leadId: lead.id,
                  },
                },
              }).catch(e => console.error("Call alert email error:", e));
            }
          } catch (e) { console.error("Call alert email error:", e); }
        })();
      }

      // Send Meta CAPI event for tracked stages (fire-and-forget)
      if (newStage === "call_agendada" || newStage === "fechado") {
        console.log("CAPI disparado para lead:", lead.email, newStage);
        supabase.functions.invoke("send-meta-capi-event", {
          body: {
            lead_id: leadId,
            email: lead.email,
            work_email: lead.work_email || undefined,
            telefone: lead.telefone || undefined,
            fb_lead_id: lead.fb_lead_id || undefined,
            stage: newStage,
          },
        }).then((response) => {
          console.log("CAPI response:", JSON.stringify(response));
        }).catch((err) => console.error("Meta CAPI error:", err));
      }

      onLeadUpdated();
    } catch (err: any) {
      toast.error("Erro ao mover lead: " + (err.message || ""));
    }
  };

  const handleQuickAction = async (lead: Lead, action: string) => {
    const now = new Date().toISOString();

    if (lead.kanban_stage === "novo" && !lead.assigned_to && userId) {
      await supabase.from("leads").update({
        assigned_to: userId,
        assigned_at: now,
        last_activity_at: now,
      }).eq("id", lead.id);
      await supabase.from("lead_activities").insert({
        lead_id: lead.id,
        user_id: userId,
        activity_type: "lead_atribuido",
        content: "Responsável atribuído automaticamente pela primeira ação",
      });
    }

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
            toast.success("Número copiado!");
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
        // Send proposal alert email (fire-and-forget)
        (async () => {
          try {
            const ownerId = lead.assigned_to || userId;
            const { data: ownerProfile } = await supabase.from("profiles").select("email").eq("id", ownerId).single();
            if (ownerProfile?.email) {
              supabase.functions.invoke("send-transactional-email", {
                body: {
                  templateName: "call-scheduled-alert",
                  recipientEmail: ownerProfile.email,
                  idempotencyKey: `call-alert-${lead.id}-${Date.now()}`,
                  templateData: {
                    leadName: lead.name,
                    company: lead.company || '',
                    cargo: lead.cargo || '',
                    telefone: lead.telefone || '',
                    email: lead.email,
                    workEmail: lead.work_email || '',
                    briefingNotes: lead.briefing_notes || '',
                    leadId: lead.id,
                  },
                },
              }).catch(e => console.error("Call alert email error:", e));
            }
          } catch (e) { console.error("Call alert email error:", e); }
        })();
        // Meta CAPI — fire-and-forget
        console.log("CAPI disparado para lead:", lead.email, "call_agendada");
        supabase.functions.invoke("send-meta-capi-event", {
          body: { lead_id: lead.id, email: lead.email, work_email: lead.work_email || undefined, telefone: lead.telefone || undefined, fb_lead_id: lead.fb_lead_id || undefined, stage: "call_agendada" },
        }).then((response) => {
          console.log("CAPI response:", JSON.stringify(response));
        }).catch((err) => console.error("Meta CAPI error:", err));
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
      case "register_submission":
        setSubmissionLead(lead);
        break;
      case "register_contact":
        setContactLead(lead);
        break;
      case "close_won":
        await supabase.from("leads").update({
          kanban_stage: "fechado", status: "converted", stage_updated_at: now, last_activity_at: now, closed_at: now,
        }).eq("id", lead.id);
        await supabase.from("lead_activities").insert({
          lead_id: lead.id, user_id: userId,
          activity_type: "fechado", content: "Lead fechado com sucesso!",
        });
        // Meta CAPI — fire-and-forget
        console.log("CAPI disparado para lead:", lead.email, "fechado");
        supabase.functions.invoke("send-meta-capi-event", {
          body: { lead_id: lead.id, email: lead.email, work_email: lead.work_email || undefined, telefone: lead.telefone || undefined, fb_lead_id: lead.fb_lead_id || undefined, stage: "fechado" },
        }).then((response) => {
          console.log("CAPI response:", JSON.stringify(response));
        }).catch((err) => console.error("Meta CAPI error:", err));
        toast.success("Lead fechado! 🎉");
        onLeadUpdated();
        break;
      case "move_to_contact":
        await supabase.from("leads").update({ kanban_stage: "em_contato", stage_updated_at: now, last_activity_at: now }).eq("id", lead.id);
        await supabase.from("lead_activities").insert({
          lead_id: lead.id, user_id: userId,
          activity_type: "em_contato", content: "Lead retornou contato",
        });
        toast.success("Lead movido para Em Contato!");
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
        lost_at_stage: lostLead.kanban_stage,
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

  const handleSubmissionConfirm = async (sentAt: Date, channels: string[], notes: string) => {
    if (!submissionLead) return;
    const now = new Date().toISOString();
    try {
      const proposal = proposals.find((p) => p.lead_id === submissionLead.id);

      await supabase.from("proposal_submissions" as any).insert({
        lead_id: submissionLead.id,
        proposal_id: proposal?.id || null,
        sent_at: sentAt.toISOString().split("T")[0],
        channels,
        notes,
        created_by: userId,
      });

      await supabase.from("leads").update({
        kanban_stage: "nutricao", stage_updated_at: now, last_activity_at: now,
      }).eq("id", submissionLead.id);

      await supabase.from("lead_activities").insert({
        lead_id: submissionLead.id, user_id: userId,
        activity_type: "proposta_enviada",
        content: `Proposta enviada via ${channels.join(", ")}${notes ? ` — ${notes}` : ""}`,
      });

      toast.success("Envio registrado! Lead movido para Nutrição.");
      onLeadUpdated();
    } catch (err: any) {
      toast.error("Erro: " + (err.message || ""));
    } finally {
      setSubmissionLead(null);
    }
  };

  const handleContactConfirm = async (content: string) => {
    if (!contactLead) return;
    const now = new Date().toISOString();
    try {
      await supabase.from("leads").update({ last_activity_at: now }).eq("id", contactLead.id);
      await supabase.from("lead_activities").insert({
        lead_id: contactLead.id, user_id: userId,
        activity_type: "contato_registrado", content,
      });
      toast.success("Contato registrado!");
      onLeadUpdated();
    } catch (err: any) {
      toast.error("Erro: " + (err.message || ""));
    } finally {
      setContactLead(null);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={(e) => { handleDragEnd(e); setActiveLead(null); }}>
        <div className="relative h-full flex flex-col">
          {canScrollLeft && (
            <button
              onClick={() => scrollBy(-290)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full flex items-center justify-center transition-opacity duration-200 shadow-md"
              style={{ background: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(4px)', border: '1px solid hsl(var(--color-border))' }}
              aria-label="Scroll esquerda"
            >
              <ChevronLeft className="h-4 w-4" style={{ color: 'hsl(var(--color-text-secondary))' }} />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scrollBy(290)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full flex items-center justify-center transition-opacity duration-200 shadow-md"
              style={{ background: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(4px)', border: '1px solid hsl(var(--color-border))' }}
              aria-label="Scroll direita"
            >
              <ChevronRight className="h-4 w-4" style={{ color: 'hsl(var(--color-text-secondary))' }} />
            </button>
          )}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 flex-1"
            onWheel={handleWheel}
            onScroll={updateScrollState}
            style={{ height: '100%' }}
          >
            {STAGES.map((stage) => {
              const stageLeads = leadsByStage[stage.id] || [];
              const stageLeadIds = new Set(stageLeads.map((l) => l.id));
              const stageProposals = proposals.filter((p) => p.lead_id && stageLeadIds.has(p.lead_id));
              return (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  leads={stageLeads}
                  profiles={profiles}
                  proposals={stageProposals}
                  followUpsByLead={followUpsByLead}
                  onOpenDrawer={(lead) => { setDrawerLead(lead); setDrawerOpen(true); }}
                  onQuickAction={handleQuickAction}
                />
              );
            })}
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {activeLead ? (
            <div
              className="bg-white border rounded-[10px] p-3 w-[260px]"
              style={{
                boxShadow: 'var(--shadow-card-drag)',
                opacity: 0.9,
                transform: 'rotate(2deg)',
                borderColor: 'hsl(var(--color-brand) / 0.4)',
              }}
            >
              <h4 className="font-semibold text-sm truncate" style={{ color: 'hsl(var(--color-text-primary))' }}>{activeLead.company || "Sem empresa"}</h4>
              <p className="text-xs truncate" style={{ color: 'hsl(var(--color-text-secondary))' }}>{activeLead.name}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <LeadDrawer
        lead={drawerLead}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onQuickAction={handleQuickAction}
        userId={userId}
        profiles={profiles}
        onNoteAdded={onLeadUpdated}
        isAdmin
      />

      <LostDialog
        open={!!lostLead}
        onOpenChange={(open) => !open && setLostLead(null)}
        onConfirm={handleLostConfirm}
        leadName={lostLead?.company || lostLead?.name || ""}
      />

      <SubmissionDialog
        open={!!submissionLead}
        onOpenChange={(open) => !open && setSubmissionLead(null)}
        onConfirm={handleSubmissionConfirm}
        leadName={submissionLead?.company || submissionLead?.name || ""}
        leadEmail={submissionLead?.email || ""}
        leadCompany={submissionLead?.company || ""}
        contactName={submissionLead?.name || ""}
      />

      <ContactDialog
        open={!!contactLead}
        onOpenChange={(open) => !open && setContactLead(null)}
        onConfirm={handleContactConfirm}
        leadName={contactLead?.company || contactLead?.name || ""}
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

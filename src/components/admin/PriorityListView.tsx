import { useMemo, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getUrgencyLevel, type UrgencyLevel } from "./UrgencyBadge";
import PriorityCard from "./PriorityCard";
import LeadDrawer from "./LeadDrawer";
import LostDialog from "./LostDialog";
import SubmissionDialog from "./SubmissionDialog";
import ContactDialog from "./ContactDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAllPendingFollowUps } from "@/hooks/useFollowUps";
import type { Lead } from "./LeadList";

const COLABORADORES_WEIGHT: Record<string, number> = {
  "mais_de_2000": 6, "acima_de_2000": 6,
  "501_a_2000": 5, "101_a_500": 4,
  "51_a_100": 3, "até_100": 3,
  "11_a_50": 2, "1_a_10": 1,
};

const GROUP_CONFIG: { key: UrgencyLevel; label: string; bg: string; border: string; icon: string }[] = [
  { key: "critical", label: "Vencidos — ação imediata", bg: "#FEF2F2", border: "#FECACA", icon: "🔴" },
  { key: "warning", label: "Atenção — agir em breve", bg: "#FFFBEB", border: "#FDE68A", icon: "⚠️" },
  { key: "normal", label: "No prazo", bg: "#F0FDF4", border: "#BBF7D0", icon: "✅" },
];

interface PriorityListViewProps {
  leads: Lead[];
  userId: string;
  profiles?: { id: string; full_name: string | null }[];
  proposals?: { id: string; lead_id?: string; investment: string }[];
  sortKey?: "sla" | "oldest" | "newest" | "value" | "size";
  onLeadUpdated: () => void;
  onGenerateProposal: (lead: Lead) => void;
  onSendWelcome: (lead: Lead) => void;
}

const PriorityListView: React.FC<PriorityListViewProps> = ({
  leads, userId, profiles = [], proposals = [], sortKey = "sla",
  onLeadUpdated, onGenerateProposal, onSendWelcome,
}) => {
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lostLead, setLostLead] = useState<Lead | null>(null);
  const [submissionLead, setSubmissionLead] = useState<Lead | null>(null);
  const [contactLead, setContactLead] = useState<Lead | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const { data: allPendingFollowUps = [] } = useAllPendingFollowUps();

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

  const activeLeads = useMemo(() =>
    leads.filter(l => l.kanban_stage !== "perdido" && l.kanban_stage !== "fechado"),
  [leads]);

  const sortLeads = (list: Lead[]) => {
    return [...list].sort((a, b) => {
      if (sortKey === "value") {
        return ((b as any).valor_proposta || 0) - ((a as any).valor_proposta || 0);
      }
      if (sortKey === "size") {
        return (COLABORADORES_WEIGHT[b.colaboradores || ""] || 0) - (COLABORADORES_WEIGHT[a.colaboradores || ""] || 0);
      }
      if (sortKey === "oldest") {
        return new Date(a.stage_updated_at || a.created_at || 0).getTime() - new Date(b.stage_updated_at || b.created_at || 0).getTime();
      }
      if (sortKey === "newest") {
        return new Date(b.stage_updated_at || b.created_at || 0).getTime() - new Date(a.stage_updated_at || a.created_at || 0).getTime();
      }
      // default: sla — bigger company first, then value, then oldest
      const sizeA = COLABORADORES_WEIGHT[a.colaboradores || ""] || 0;
      const sizeB = COLABORADORES_WEIGHT[b.colaboradores || ""] || 0;
      if (sizeB !== sizeA) return sizeB - sizeA;
      const valA = (a as any).valor_proposta || 0;
      const valB = (b as any).valor_proposta || 0;
      if (valB !== valA) return valB - valA;
      return new Date(a.stage_updated_at || a.created_at || 0).getTime() - new Date(b.stage_updated_at || b.created_at || 0).getTime();
    });
  };

  const groups = useMemo(() => {
    const grouped: Record<UrgencyLevel, Lead[]> = { critical: [], warning: [], normal: [] };
    activeLeads.forEach(lead => {
      const fu = followUpsByLead[lead.id];
      const hasPending = fu ? (fu.hasToday || fu.hasFuture) && !fu.hasOverdue : false;
      const level = getUrgencyLevel(lead.kanban_stage, lead.stage_updated_at || null, lead.last_activity_at || null, hasPending);
      grouped[level].push(lead);
    });
    return {
      critical: sortLeads(grouped.critical),
      warning: sortLeads(grouped.warning),
      normal: sortLeads(grouped.normal),
    };
  }, [activeLeads, followUpsByLead, sortKey]);

  const toggle = (key: string) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const handleQuickAction = async (lead: Lead, action: string) => {
    const now = new Date().toISOString();
    switch (action) {
      case "send_welcome": onSendWelcome(lead); break;
      case "generate_proposal": onGenerateProposal(lead); break;
      case "mark_lost": setLostLead(lead); break;
      case "register_submission": setSubmissionLead(lead); break;
      case "register_contact": setContactLead(lead); break;
      case "close_won":
        await supabase.from("leads").update({ kanban_stage: "fechado", status: "converted", stage_updated_at: now, last_activity_at: now, closed_at: now }).eq("id", lead.id);
        await supabase.from("lead_activities").insert({ lead_id: lead.id, user_id: userId, activity_type: "fechado", content: "Lead fechado com sucesso!" });
        toast.success("Lead fechado! 🎉");
        onLeadUpdated();
        break;
      default: break;
    }
  };

  const handleLostConfirm = async (reason: string, notes: string) => {
    if (!lostLead) return;
    const now = new Date().toISOString();
    await supabase.from("leads").update({ kanban_stage: "perdido", lost_reason: reason, lost_notes: notes, lost_at_stage: lostLead.kanban_stage, stage_updated_at: now, last_activity_at: now }).eq("id", lostLead.id);
    await supabase.from("lead_activities").insert({ lead_id: lostLead.id, user_id: userId, activity_type: "perdido", content: `Perdido: ${reason}${notes ? ` — ${notes}` : ""}` });
    toast.success("Lead marcado como perdido");
    onLeadUpdated();
    setLostLead(null);
  };

  const handleSubmissionConfirm = async (sentAt: Date, channels: string[], notes: string) => {
    if (!submissionLead) return;
    const now = new Date().toISOString();
    const proposal = proposals.find(p => p.lead_id === submissionLead.id);
    await supabase.from("proposal_submissions" as any).insert({ lead_id: submissionLead.id, proposal_id: proposal?.id || null, sent_at: sentAt.toISOString().split("T")[0], channels, notes, created_by: userId });
    await supabase.from("leads").update({ kanban_stage: "nutricao", stage_updated_at: now, last_activity_at: now }).eq("id", submissionLead.id);
    await supabase.from("lead_activities").insert({ lead_id: submissionLead.id, user_id: userId, activity_type: "proposta_enviada", content: `Proposta enviada via ${channels.join(", ")}` });
    toast.success("Envio registrado!");
    onLeadUpdated();
    setSubmissionLead(null);
  };

  const handleContactConfirm = async (content: string) => {
    if (!contactLead) return;
    const now = new Date().toISOString();
    await supabase.from("leads").update({ last_activity_at: now }).eq("id", contactLead.id);
    await supabase.from("lead_activities").insert({ lead_id: contactLead.id, user_id: userId, activity_type: "contato_registrado", content });
    toast.success("Contato registrado!");
    onLeadUpdated();
    setContactLead(null);
  };

  if (activeLeads.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm" style={{ color: 'hsl(var(--color-text-muted))' }}>
        Nenhum lead ativo encontrado.
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-3">
        {GROUP_CONFIG.map(group => {
          const items = groups[group.key];
          if (items.length === 0) return null;
          const isCollapsed = collapsed[group.key];

          return (
            <div key={group.key} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${group.border}` }}>
              <button
                onClick={() => toggle(group.key)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold"
                style={{ background: group.bg, color: 'hsl(var(--color-text-primary))' }}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span>{group.icon} {group.label}</span>
                <Badge className="ml-auto h-5 px-2 text-[10px] font-bold" style={{ background: group.border, color: 'hsl(var(--color-text-primary))' }}>
                  {items.length}
                </Badge>
              </button>
              {!isCollapsed && (
                <div className="p-2 space-y-1.5" style={{ background: 'hsl(var(--background))' }}>
                  {items.map(lead => {
                    const fu = followUpsByLead[lead.id];
                    const hasPending = fu ? (fu.hasToday || fu.hasFuture) && !fu.hasOverdue : false;
                    return (
                      <PriorityCard
                        key={lead.id}
                        lead={lead}
                        hasPendingFollowUp={hasPending}
                        onClick={(l) => { setDrawerLead(l); setDrawerOpen(true); }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

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

      <LostDialog open={!!lostLead} onOpenChange={(open) => !open && setLostLead(null)} onConfirm={handleLostConfirm} leadName={lostLead?.company || lostLead?.name || ""} />
      <SubmissionDialog open={!!submissionLead} onOpenChange={(open) => !open && setSubmissionLead(null)} onConfirm={handleSubmissionConfirm} leadName={submissionLead?.company || submissionLead?.name || ""} leadEmail={submissionLead?.email || ""} leadCompany={submissionLead?.company || ""} contactName={submissionLead?.name || ""} />
      <ContactDialog open={!!contactLead} onOpenChange={(open) => !open && setContactLead(null)} onConfirm={handleContactConfirm} leadName={contactLead?.company || contactLead?.name || ""} />
    </TooltipProvider>
  );
};

export default PriorityListView;

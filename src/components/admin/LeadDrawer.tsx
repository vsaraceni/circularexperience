import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Building2, Mail, Phone, Briefcase, Calendar, Tag, User,
  Send, FileText, Linkedin, MessageSquare, CheckCircle, XCircle, CalendarPlus,
  Globe, Sparkles, Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UrgencyBadge from "./UrgencyBadge";
import ActivityTimeline from "./ActivityTimeline";
import type { Lead } from "./LeadList";

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

interface LeadDrawerProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuickAction: (lead: Lead, action: string) => void;
  userId?: string;
  profiles?: { id: string; full_name: string | null }[];
  onNoteAdded?: () => void;
}

const LeadDrawer: React.FC<LeadDrawerProps> = ({ lead, open, onOpenChange, onQuickAction, userId, profiles = [], onNoteAdded }) => {
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [enriching, setEnriching] = useState(false);

  if (!lead) return null;

  const handleEnrich = async () => {
    setEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke("enrich-lead", {
        body: { lead_id: lead.id, user_id: userId },
      });
      if (error) throw error;
      if (data?.success) {
        lead.company_website = data.company_website;
        lead.company_description = data.company_description;
        setRefreshKey((k) => k + 1);
        onNoteAdded?.();
        toast.success("Empresa enriquecida!");
      } else {
        toast.error(data?.error || "Erro ao enriquecer");
      }
    } catch {
      toast.error("Erro ao enriquecer empresa");
    } finally {
      setEnriching(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim() || !userId) return;
    setSavingNote(true);
    try {
      await supabase.from("lead_activities").insert({
        lead_id: lead.id,
        user_id: userId,
        activity_type: "nota_manual",
        content: noteText.trim(),
      });
      await supabase.from("leads").update({ last_activity_at: new Date().toISOString() }).eq("id", lead.id);
      setNoteText("");
      setRefreshKey((k) => k + 1);
      onNoteAdded?.();
      toast.success("Nota salva!");
    } catch {
      toast.error("Erro ao salvar nota");
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[440px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {lead.company || "Sem empresa"}
          </SheetTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{STAGE_LABELS[lead.kanban_stage] || lead.kanban_stage}</Badge>
            <UrgencyBadge stage={lead.kanban_stage} stageUpdatedAt={lead.stage_updated_at || null} lastActivityAt={lead.last_activity_at || null} />
            {lead.welcome_sent && (
              <Badge variant="outline" className="text-xs gap-1">
                <CheckCircle className="h-3 w-3" /> Welcome enviado
              </Badge>
            )}
          </div>
        </SheetHeader>

        <Tabs defaultValue="resumo" className="mt-2">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="atividades">Atividades</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="space-y-4 mt-4">
            <div className="space-y-2">
              <InfoRow icon={<User className="h-4 w-4" />} label="Contato" value={lead.name} linkedin={lead.name} company={lead.company} />
              <InfoRow icon={<Mail className="h-4 w-4" />} label="E-mail" value={lead.email} />
              {lead.telefone && (
                <InfoRow icon={<Phone className="h-4 w-4" />} label="Telefone" value={lead.telefone} whatsapp={lead.telefone} />
              )}
              {lead.cargo && <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Cargo" value={lead.cargo} />}
              <InfoRow icon={<Tag className="h-4 w-4" />} label="Origem" value={lead.origem} />

              {/* Responsável */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground shrink-0"><User className="h-4 w-4" /></span>
                <span className="text-muted-foreground text-xs w-16 shrink-0">Responsável</span>
                <Select
                  value={lead.assigned_to || "unassigned"}
                  onValueChange={async (val) => {
                    const newOwner = val === "unassigned" ? null : val;
                    const now = new Date().toISOString();
                    await supabase.from("leads").update({
                      assigned_to: newOwner,
                      assigned_at: newOwner ? now : null,
                      last_activity_at: now,
                    }).eq("id", lead.id);
                    const ownerName = profiles.find((p) => p.id === val)?.full_name || "Ninguém";
                    await supabase.from("lead_activities").insert({
                      lead_id: lead.id,
                      user_id: userId,
                      activity_type: "lead_reatribuido",
                      content: `Responsável alterado para ${ownerName}`,
                    });
                    toast.success("Responsável atualizado!");
                    onNoteAdded?.();
                  }}
                >
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Sem responsável</SelectItem>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name || p.id.slice(0, 8)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Criado em"
                value={format(new Date(lead.created_at), "dd MMM yyyy", { locale: ptBR })}
              />
            </div>

            {/* Company enrichment section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Empresa</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={handleEnrich}
                  disabled={enriching}
                >
                  {enriching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {enriching ? "Enriquecendo..." : lead.company_description ? "Reenriquecer" : "Enriquecer"}
                </Button>
              </div>
              {lead.company_website && (
                <InfoRow
                  icon={<Globe className="h-4 w-4" />}
                  label="Site"
                  value={lead.company_website.replace(/^https?:\/\//, "")}
                  href={lead.company_website}
                />
              )}
              {lead.company_description && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Sobre a empresa</p>
                  <p className="text-sm text-foreground">{lead.company_description}</p>
                </div>
              )}
            </div>

            {lead.mensagem && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Mensagem</p>
                <p className="text-sm text-foreground">{lead.mensagem}</p>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações Rápidas</p>
              <div className="grid grid-cols-2 gap-2">
                {lead.kanban_stage === "novo" && (
                  <ActionBtn icon={<Send />} label={lead.welcome_sent ? "Enviado ✓" : "Enviar Boas-Vindas"} tooltip="Enviar e-mail de boas-vindas" onClick={() => onQuickAction(lead, "send_welcome")} />
                )}
                {lead.kanban_stage === "boas_vindas" && (
                  <>
                    <ActionBtn icon={<Linkedin />} label="LinkedIn" tooltip="Buscar no LinkedIn" onClick={() => onQuickAction(lead, "linkedin")} />
                    <ActionBtn icon={<MessageSquare />} label="Copiar Zap" tooltip="Copiar telefone para WhatsApp" onClick={() => onQuickAction(lead, "copy_whatsapp")} />
                  </>
                )}
                {lead.kanban_stage === "em_contato" && (
                  <ActionBtn icon={<CalendarPlus />} label="Agendar Call" tooltip="Agendar call e mover para Call Agendada" onClick={() => onQuickAction(lead, "schedule_call")} />
                )}
                {lead.kanban_stage === "call_agendada" && (
                  <ActionBtn icon={<CheckCircle />} label="Call Realizada" tooltip="Registrar call realizada" onClick={() => onQuickAction(lead, "call_done")} />
                )}
                {lead.kanban_stage === "proposta" && (
                  <>
                    <ActionBtn icon={<FileText />} label="Elab. Proposta" tooltip="Criar proposta comercial" onClick={() => onQuickAction(lead, "generate_proposal")} />
                    <ActionBtn icon={<Send />} label="Registrar Envio" tooltip="Registrar envio da proposta" onClick={() => onQuickAction(lead, "register_submission")} />
                  </>
                )}
                {lead.kanban_stage === "nutricao" && (
                  <>
                    <ActionBtn icon={<MessageSquare />} label="Registrar Contato" tooltip="Registrar contato realizado" onClick={() => onQuickAction(lead, "register_contact")} />
                    <ActionBtn icon={<CheckCircle />} label="Fechar" tooltip="Fechar lead com sucesso" onClick={() => onQuickAction(lead, "close_won")} variant="default" />
                  </>
                )}
                {["em_contato", "call_agendada", "proposta", "nutricao"].includes(lead.kanban_stage) && (
                  <ActionBtn icon={<XCircle />} label="Perdido" tooltip="Marcar como perdido" onClick={() => onQuickAction(lead, "mark_lost")} variant="destructive" />
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="atividades" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Adicionar nota..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              <Button size="sm" disabled={!noteText.trim() || savingNote} onClick={handleSaveNote}>
                {savingNote ? "Salvando..." : "Salvar nota"}
              </Button>
            </div>
            <ActivityTimeline leadId={lead.id} refreshKey={refreshKey} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

function InfoRow({
  icon, label, value, linkedin, company, whatsapp, href,
}: {
  icon: React.ReactNode; label: string; value: string;
  linkedin?: string; company?: string; whatsapp?: string; href?: string;
}) {
  const content = (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-muted-foreground text-xs w-16 shrink-0">{label}</span>
      <span className="text-foreground truncate">{value}</span>
    </div>
  );

  if (linkedin) {
    return (
      <a
        href={`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(`${linkedin} ${company || ""}`.trim())}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:text-primary transition-colors"
      >
        {content}
      </a>
    );
  }

  if (whatsapp) {
    return (
      <a
        href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:text-primary transition-colors"
      >
        {content}
      </a>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:text-primary transition-colors"
      >
        {content}
      </a>
    );
  }

  return content;
}

function ActionBtn({
  icon, label, tooltip, onClick, variant = "outline",
}: {
  icon: React.ReactNode; label: string; tooltip: string; onClick: () => void; variant?: "outline" | "default" | "destructive";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={variant} size="sm" className="justify-start gap-2 h-9" onClick={onClick}>
          {icon}
          {label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export default LeadDrawer;

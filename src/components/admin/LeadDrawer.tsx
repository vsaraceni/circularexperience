import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Building2, Mail, Phone, Briefcase, Calendar, Tag, User,
  Send, FileText, Linkedin, MessageSquare, CheckCircle, XCircle, CalendarPlus,
  Globe, Sparkles, Loader2, Copy, RotateCcw, AlertTriangle, Save, Settings,
  ChevronRight, Pencil, Check, X as XIcon, Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import UrgencyBadge from "./UrgencyBadge";
import ActivityTimeline from "./ActivityTimeline";
import HeatDots from "./HeatDots";
import {
  replaceVariables,
  hasManualVariables,
  CHANNEL_CONFIG,
  type TemplateWithOverride,
} from "./messageTemplates";
import { useTemplatesWithOverrides, useSaveTemplateOverride, useDeleteTemplateOverride } from "@/hooks/useMessageTemplates";
import { useLeadFollowUps, useCreateFollowUp, useCompleteFollowUp } from "@/hooks/useFollowUps";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";

import { cn } from "@/lib/utils";
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

const COLABORADORES_LABELS: Record<string, string> = {
  "1_a_10": "1 a 10",
  "11_a_50": "11 a 50",
  "51_a_100": "51 a 100",
  "até_100": "Até 100",
  "101_a_500": "101 a 500",
  "501_a_2000": "501 a 2.000",
  "mais_de_2000": "Mais de 2.000",
  "acima_de_2000": "Acima de 2.000",
};

const formatColaboradores = (value?: string | null): string => {
  if (!value) return "—";
  return COLABORADORES_LABELS[value] || value.replace(/_/g, " ");
};

interface LeadDrawerProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuickAction: (lead: Lead, action: string) => void;
  userId?: string;
  profiles?: { id: string; full_name: string | null }[];
  onNoteAdded?: () => void;
  isAdmin?: boolean;
  defaultTab?: string;
}

const LeadDrawer: React.FC<LeadDrawerProps> = ({ lead, open, onOpenChange, onQuickAction, userId, profiles = [], onNoteAdded, isAdmin, defaultTab = "resumo" }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [refreshKey, setRefreshKey] = useState(0);
  const [enriching, setEnriching] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [followUpNote, setFollowUpNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>();
  const navigate = useNavigate();

  // Sync defaultTab when drawer opens with a specific tab
  useEffect(() => {
    if (open) setActiveTab(defaultTab);
  }, [open, defaultTab]);

  // Resolve the lead's product context via its most recent proposal (if any).
  const { data: leadProductId } = useQuery({
    queryKey: ["lead_product_id", lead?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("proposals")
        .select("product_id, created_at")
        .eq("lead_id", lead!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.product_id ?? null;
    },
    enabled: !!lead?.id,
  });

  const { data: templates = [], isLoading: loadingTemplates } = useTemplatesWithOverrides(
    lead?.kanban_stage || "",
    userId,
    leadProductId,
  );
  const saveOverride = useSaveTemplateOverride();
  const deleteOverride = useDeleteTemplateOverride();
  const { data: followUps = [], isLoading: loadingFollowUps } = useLeadFollowUps(lead?.id);
  const createFollowUp = useCreateFollowUp();
  const completeFollowUp = useCompleteFollowUp();

  // Fetch last proposal submission date for this lead
  const { data: lastSubmissionDate } = useQuery({
    queryKey: ["last_submission_date", lead?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("proposal_submissions")
        .select("sent_at")
        .eq("lead_id", lead!.id)
        .order("sent_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.sent_at) {
        const d = new Date(data.sent_at);
        return format(d, "dd/MM", { locale: ptBR });
      }
      return null;
    },
    enabled: !!lead?.id,
  });

  if (!lead) return null;

  const assignedProfile = profiles.find((p) => p.id === lead.assigned_to) || null;
  const extraVars = { data_envio_proposta: lastSubmissionDate };

  const getEffectiveBody = (t: TemplateWithOverride) => t.override_body || t.body;
  const getFilledBody = (t: TemplateWithOverride) => replaceVariables(getEffectiveBody(t), lead, assignedProfile, extraVars);
  const getCurrentText = (t: TemplateWithOverride) => edits[t.id] ?? getFilledBody(t);

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


  const handleCopyTemplate = async (t: TemplateWithOverride) => {
    const text = getCurrentText(t);
    const hasManual = hasManualVariables(text);
    await navigator.clipboard.writeText(text);

    if (hasManual) {
      toast("Mensagem copiada — atenção: há campos para preencher", {
        icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
        duration: 3000,
      });
    } else {
      toast.success("Mensagem copiada!", { duration: 2000 });
    }

    if (userId) {
      try {
        await supabase.from("lead_activities").insert({
          lead_id: lead.id,
          user_id: userId,
          activity_type: "template_copiado",
          content: `Template copiado: ${t.title}`,
          metadata: { template_id: t.id, channel: t.channel } as any,
        });
        await supabase.from("leads").update({ last_activity_at: new Date().toISOString() }).eq("id", lead.id);
        onNoteAdded?.();
      } catch {
        // silent
      }
    }
  };

  const handleEditTemplate = (id: string, value: string) => {
    setEdits((prev) => ({ ...prev, [id]: value }));
  };

  const handleSaveAsMyVersion = async (t: TemplateWithOverride) => {
    if (!userId) return;
    const text = edits[t.id];
    if (!text) return;
    try {
      await saveOverride.mutateAsync({ templateId: t.id, userId, body: text });
      setEdits((prev) => { const n = { ...prev }; delete n[t.id]; return n; });
      toast.success("Salvo como sua versão personalizada!");
    } catch {
      toast.error("Erro ao salvar personalização");
    }
  };

  const handleRestoreDefault = async (t: TemplateWithOverride) => {
    if (t.override_id) {
      try {
        await deleteOverride.mutateAsync(t.override_id);
        setEdits((prev) => { const n = { ...prev }; delete n[t.id]; return n; });
        toast.success("Restaurado para o padrão!");
      } catch {
        toast.error("Erro ao restaurar");
      }
    } else {
      setEdits((prev) => { const n = { ...prev }; delete n[t.id]; return n; });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[440px] flex flex-col overflow-hidden">
        <SheetHeader className="pb-4 shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {lead.company || "Sem empresa"}
          </SheetTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{STAGE_LABELS[lead.kanban_stage] || lead.kanban_stage}</Badge>
            <UrgencyBadge
              stage={lead.kanban_stage}
              stageUpdatedAt={lead.stage_updated_at || null}
              lastActivityAt={lead.last_activity_at || null}
              nextFollowUp={(() => {
                const pending = followUps.filter(f => !f.completed).sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
                return pending ? { due_date: pending.due_date } : null;
              })()}
            />
            {lead.welcome_sent && (
              <Badge variant="outline" className="text-xs gap-1">
                <CheckCircle className="h-3 w-3" /> Welcome enviado
              </Badge>
            )}
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
          <TabsList className="w-full grid grid-cols-3 shrink-0">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="followups" className="gap-1">
              Follow-ups
              {followUps.filter(f => !f.completed).length > 0 && (
                <Badge variant="destructive" className="h-4 min-w-[16px] px-1 text-[10px]">
                  {followUps.filter(f => !f.completed).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="atividades">Atividades</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="overflow-y-auto mt-4 pr-1">
              {/* Action fields */}
              {lead.kanban_stage !== "perdido" && lead.kanban_stage !== "fechado" && (
                <div className="mb-4 space-y-3 rounded-lg border p-3" style={{ borderColor: 'hsl(var(--color-border))', background: 'hsl(var(--muted) / 0.3)' }}>
                  <AdvanceStageButton lead={lead} userId={userId} onDone={() => { onNoteAdded?.(); setActiveTab("followups"); }} />
                </div>
              )}
              <Accordion type="single" collapsible defaultValue="lead-data">
                {/* Block 1: Dados do Lead */}
                <AccordionItem value="lead-data">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Dados do Lead
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <EditableField
                        icon={<User className="h-4 w-4" />}
                        label="Contato"
                        value={lead.name}
                        field="name"
                        leadId={lead.id}
                        userId={userId}
                        validate={(v) => {
                          if (!v.trim()) return "Nome obrigatório";
                          if (v.length > 200) return "Máximo 200 caracteres";
                          return null;
                        }}
                        linkHref={`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(`${lead.name} ${lead.company || ""}`.trim())}`}
                        onSaved={() => onNoteAdded?.()}
                      />
                      <EditableField
                        icon={<Mail className="h-4 w-4" />}
                        label="E-mail"
                        value={lead.email}
                        field="email"
                        leadId={lead.id}
                        userId={userId}
                        validate={(v) => {
                          if (!v.trim()) return "E-mail obrigatório";
                          if (v.length > 320) return "Máximo 320 caracteres";
                          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return "E-mail inválido";
                          return null;
                        }}
                        onSaved={() => onNoteAdded?.()}
                      />
                      <EditableField
                        icon={<Phone className="h-4 w-4" />}
                        label="Telefone"
                        value={lead.telefone || ""}
                        field="telefone"
                        leadId={lead.id}
                        userId={userId}
                        placeholder="—"
                        validate={(v) => {
                          if (!v.trim()) return null;
                          if (v.length > 40) return "Máximo 40 caracteres";
                          if (!/^[\d\s+()\-]+$/.test(v.trim())) return "Use apenas dígitos, +, espaços, () e -";
                          return null;
                        }}
                        linkHref={lead.telefone ? `https://wa.me/${lead.telefone.replace(/\D/g, "")}` : undefined}
                        onSaved={() => onNoteAdded?.()}
                      />
                      <EditableField
                        icon={<Building2 className="h-4 w-4" />}
                        label="Empresa"
                        value={lead.company || ""}
                        field="company"
                        leadId={lead.id}
                        userId={userId}
                        placeholder="—"
                        validate={(v) => v.length > 255 ? "Máximo 255 caracteres" : null}
                        onSaved={() => onNoteAdded?.()}
                      />
                      <EditableField
                        icon={<Briefcase className="h-4 w-4" />}
                        label="Cargo"
                        value={lead.cargo || ""}
                        field="cargo"
                        leadId={lead.id}
                        userId={userId}
                        placeholder="—"
                        validate={(v) => v.length > 120 ? "Máximo 120 caracteres" : null}
                        onSaved={() => onNoteAdded?.()}
                      />
                      <InfoRow icon={<Tag className="h-4 w-4" />} label="Origem" value={lead.origem} />
                      <InfoRow icon={<Building2 className="h-4 w-4" />} label="Porte" value={formatColaboradores(lead.colaboradores)} />
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground shrink-0"><Sparkles className="h-4 w-4" /></span>
                        <span className="text-muted-foreground text-xs w-16 shrink-0">Calor</span>
                        <HeatDots
                          value={lead.lead_heat}
                          onChange={async (v) => {
                            await supabase.from("leads").update({ lead_heat: v }).eq("id", lead.id);
                            toast.success("Calor atualizado!");
                            onNoteAdded?.();
                          }}
                          size="md"
                        />
                      </div>
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
                      {lead.mensagem && (
                        <div className="bg-muted/50 rounded-lg p-3 mt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Mensagem</p>
                          <p className="text-sm text-foreground">{lead.mensagem}</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Block 2: Empresa */}
                <AccordionItem value="empresa">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      Empresa
                      {lead.company_description && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">enriquecida</Badge>
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-end">
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleEnrich} disabled={enriching}>
                          {enriching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                          {enriching ? "Enriquecendo..." : lead.company_description ? "Reenriquecer" : "Enriquecer"}
                        </Button>
                      </div>
                      {lead.company_website && (
                        <InfoRow icon={<Globe className="h-4 w-4" />} label="Site" value={lead.company_website.replace(/^https?:\/\//, "")} href={lead.company_website} />
                      )}
                      {lead.company_description && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Sobre a empresa</p>
                          <p className="text-sm text-foreground">{lead.company_description}</p>
                        </div>
                      )}
                      {!lead.company_website && !lead.company_description && (
                        <p className="text-xs text-muted-foreground italic">Nenhuma informação. Use "Enriquecer" para buscar dados.</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Block: Briefing (all active stages) */}
                {lead.kanban_stage !== "perdido" && lead.kanban_stage !== "fechado" && (
                  <AccordionItem value="briefing">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Briefing
                        {(lead.kanban_stage === "call_agendada" || lead.kanban_stage === "proposta") &&
                          (!(lead as any).briefing_notes || (lead as any).briefing_notes.trim() === "") && (
                          <Badge className="text-[10px] h-4 px-1.5 ml-1" style={{ background: "#FFFDE7", color: "#F9A825", border: "none" }}>
                            Pendente
                          </Badge>
                        )}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <BriefingField
                        leadId={lead.id}
                        initialValue={(lead as any).briefing_notes || ""}
                        onSaved={() => onNoteAdded?.()}
                      />
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Block 3: Mensagens */}
                {templates.length > 0 && (
                  <AccordionItem value="mensagens">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        Mensagens
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">{templates.length}</Badge>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1">
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 w-full justify-center"
                            onClick={() => navigate("/admin/templates")}
                          >
                            <Settings className="h-3 w-3" />
                            Gerenciar templates
                          </Button>
                        )}
                        {templates.map((t) => {
                          const isEdited = t.id in edits;
                          const hasOverride = !!t.override_body;
                          const channelCfg = CHANNEL_CONFIG[t.channel];
                          const currentText = getCurrentText(t);

                          return (
                            <div key={t.id} className="border border-border rounded-lg p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${channelCfg.color}`}>
                                  {channelCfg.label}
                                </span>
                                <span className="text-xs font-medium text-foreground flex-1">{t.title}</span>
                                {hasOverride && !isEdited && (
                                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 rounded px-1.5 py-0.5">
                                    personalizado
                                  </span>
                                )}
                                {isEdited && (
                                  <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">editado</span>
                                )}
                              </div>

                              {t.subject && (
                                <p className="text-[10px] text-muted-foreground">
                                  <span className="font-medium">Assunto:</span> {t.subject}
                                </p>
                              )}

                              <Textarea
                                value={currentText}
                                onChange={(e) => handleEditTemplate(t.id, e.target.value)}
                                className="text-xs min-h-[132px] font-mono leading-relaxed resize-y"
                              />

                              {!isEdited && hasManualVariables(currentText) && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Campos destacados precisam ser preenchidos
                                </p>
                              )}

                              <div className="flex items-center gap-2 flex-wrap">
                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleCopyTemplate(t)}>
                                  <Copy className="h-3 w-3" />
                                  Copiar
                                </Button>
                                {isEdited && (
                                  <>
                                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => handleSaveAsMyVersion(t)}>
                                      <Save className="h-3 w-3" />
                                      Salvar como minha versão
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => handleRestoreDefault(t)}>
                                      <RotateCcw className="h-3 w-3" />
                                      {hasOverride ? "Restaurar padrão" : "Desfazer"}
                                    </Button>
                                  </>
                                )}
                                {!isEdited && hasOverride && (
                                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => handleRestoreDefault(t)}>
                                    <RotateCcw className="h-3 w-3" />
                                    Restaurar padrão
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
          </TabsContent>

          <TabsContent value="followups" className="mt-4 overflow-hidden">
            <div className="space-y-3 mb-4 rounded-lg border p-3" style={{ borderColor: 'hsl(var(--color-border))', background: 'hsl(var(--muted) / 0.3)' }}>
              <p className="text-sm font-medium text-foreground">Agendar próximo passo</p>
              <Textarea
                placeholder="Qual a próxima ação? (obrigatório)"
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                className="text-xs min-h-[60px] resize-y"
              />
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1 w-[160px] justify-start", !followUpDate && "text-muted-foreground")}>
                      <Calendar className="h-3 w-3" />
                      {followUpDate ? format(followUpDate, "dd/MM/yyyy") : "Data (obrigatório)"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarWidget
                      mode="single"
                      selected={followUpDate}
                      onSelect={setFollowUpDate}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  size="sm"
                  className="h-8 text-xs flex-1"
                  disabled={!followUpDate || !followUpNote.trim() || createFollowUp.isPending}
                  onClick={async () => {
                    if (!followUpDate || !followUpNote.trim() || !userId) return;
                    await createFollowUp.mutateAsync({
                      leadId: lead.id,
                      userId,
                      dueDate: format(followUpDate, "yyyy-MM-dd"),
                      note: followUpNote.trim(),
                    });
                    setFollowUpDate(undefined);
                    setFollowUpNote("");
                    onNoteAdded?.();
                    toast.success("Follow-up agendado!");
                  }}
                >
                  Agendar
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {followUps.filter(f => !f.completed).length === 0 && !loadingFollowUps && (
                <p className="text-xs text-muted-foreground italic text-center py-4">Nenhum follow-up pendente</p>
              )}
              {followUps.filter(f => !f.completed).map(f => {
                const dueDate = new Date(f.due_date + "T00:00:00");
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const isOverdue = dueDate < today;
                const isToday = dueDate.getTime() === today.getTime();
                return (
                  <div key={f.id} className={cn(
                    "border rounded-lg p-3 flex items-start gap-3",
                    isOverdue ? "border-destructive/40 bg-destructive/5" : isToday ? "border-amber-400/40 bg-amber-50 dark:bg-amber-900/10" : "border-border"
                  )}>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-medium", isOverdue ? "text-destructive" : isToday ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>
                        {isOverdue ? "🔴 Atrasado" : isToday ? "📅 Hoje" : format(dueDate, "dd MMM", { locale: ptBR })}
                        {" · "}{format(dueDate, "dd/MM/yyyy")}
                      </p>
                      {f.note && <p className="text-xs text-muted-foreground mt-0.5">{f.note}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 shrink-0"
                      disabled={completeFollowUp.isPending}
                      onClick={async () => {
                        await completeFollowUp.mutateAsync({ id: f.id, leadId: lead.id, userId: userId! });
                        onNoteAdded?.();
                        toast.success("Follow-up concluído!");
                      }}
                    >
                      <CheckCircle className="h-3 w-3" /> Concluir
                    </Button>
                  </div>
                );
              })}

              {followUps.filter(f => f.completed).length > 0 && (
                <Accordion type="single" collapsible>
                  <AccordionItem value="completed">
                    <AccordionTrigger className="text-xs text-muted-foreground hover:no-underline py-2">
                      Concluídos ({followUps.filter(f => f.completed).length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {followUps.filter(f => f.completed).map(f => (
                          <div key={f.id} className="border border-border rounded-lg p-2 opacity-60">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(f.due_date + "T00:00:00"), "dd/MM/yyyy")}
                              {f.completed_at && ` · concluído em ${format(new Date(f.completed_at), "dd/MM", { locale: ptBR })}`}
                            </p>
                            {f.note && <p className="text-xs text-muted-foreground mt-0.5">{f.note}</p>}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          </TabsContent>

          <TabsContent value="atividades" className="mt-4 overflow-y-auto space-y-4">
            <ActivityTimeline leadId={lead.id} refreshKey={refreshKey} />
          </TabsContent>
        </Tabs>

        {/* Footer fixo — ações rápidas visíveis em qualquer aba */}
        <div className="shrink-0 border-t border-border pt-3 pb-2 px-1">
          <div className="grid grid-cols-2 gap-2">
            {lead.kanban_stage === "novo" && (
              <>
                <ActionBtn icon={<Send />} label={lead.welcome_sent ? "Enviado ✓" : "Enviar Boas-Vindas"} tooltip="Enviar e-mail de boas-vindas" onClick={() => onQuickAction(lead, "send_welcome")} />
                {isAdmin && (
                  <DeleteLeadButton
                    leadId={lead.id}
                    leadLabel={lead.company || lead.name}
                    onDeleted={() => { onOpenChange(false); onNoteAdded?.(); }}
                  />
                )}
              </>
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
      </SheetContent>
    </Sheet>
  );
};

function InfoRow({
  icon, label, value, linkedin, company, whatsapp, href, copyable,
}: {
  icon: React.ReactNode; label: string; value: string;
  linkedin?: string; company?: string; whatsapp?: string; href?: string; copyable?: boolean;
}) {
  const handleCopy = copyable ? () => {
    navigator.clipboard.writeText(value).then(() => toast.success("E-mail copiado!"));
  } : undefined;

  const content = (
    <div className={cn("flex items-center gap-2 text-sm", copyable && "cursor-pointer group")} onClick={handleCopy} title={copyable ? "Clique para copiar" : undefined}>
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-muted-foreground text-xs w-16 shrink-0">{label}</span>
      <span className="text-foreground truncate">{value}</span>
      {copyable && <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />}
    </div>
  );
  if (linkedin) {
    return <a href={`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(`${linkedin} ${company || ""}`.trim())}`} target="_blank" rel="noopener noreferrer" className="block hover:text-primary transition-colors">{content}</a>;
  }
  if (whatsapp) {
    return <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="block hover:text-primary transition-colors">{content}</a>;
  }
  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className="block hover:text-primary transition-colors">{content}</a>;
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

function BriefingField({ leadId, initialValue, onSaved }: { leadId: string; initialValue: string; onSaved: () => void }) {
  const [text, setText] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const dirty = text !== initialValue;

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from("leads").update({ briefing_notes: text } as any).eq("id", leadId);
      toast.success("Briefing salvo!");
      onSaved();
    } catch {
      toast.error("Erro ao salvar briefing");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Notas de briefing para a call..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[132px] text-sm font-mono leading-relaxed resize-y"
      />
      <Button size="sm" disabled={!dirty || saving} onClick={handleSave}>
        {saving ? "Salvando..." : "Salvar briefing"}
      </Button>
    </div>
  );
}


const STAGE_ORDER = ["novo", "boas_vindas", "em_contato", "call_agendada", "proposta", "nutricao", "fechado"];

function AdvanceStageButton({ lead, userId, onDone }: { lead: Lead; userId?: string; onDone?: () => void }) {
  const [loading, setLoading] = useState(false);
  const currentIdx = STAGE_ORDER.indexOf(lead.kanban_stage);

  if (currentIdx < 0 || currentIdx >= STAGE_ORDER.length - 1) return null;

  const nextStage = STAGE_ORDER[currentIdx + 1];
  const nextLabel = STAGE_LABELS[nextStage] || nextStage;
  const isClosing = nextStage === "fechado";

  const handleAdvance = async () => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const updates: any = { kanban_stage: nextStage, stage_updated_at: now, last_activity_at: now };
      if (isClosing) { updates.status = "converted"; updates.closed_at = now; }
      await supabase.from("leads").update(updates).eq("id", lead.id);
      if (userId) {
        await supabase.from("lead_activities").insert({
          lead_id: lead.id, user_id: userId,
          activity_type: "stage_mudou",
          content: `Avançado para ${nextLabel}`,
          metadata: { from: lead.kanban_stage, to: nextStage },
        });
      }
      toast.success(isClosing ? "Lead fechado! 🎉" : `Avançado para ${nextLabel}`);
      onDone?.();
    } catch {
      toast.error("Erro ao avançar etapa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      className="w-full h-8 text-xs gap-1"
      style={{ background: isClosing ? '#388E3C' : 'hsl(var(--color-brand))', color: 'white' }}
      disabled={loading}
      onClick={handleAdvance}
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronRight className="h-3 w-3" />}
      {isClosing ? "Marcar como Ganho" : `Avançar → ${nextLabel}`}
    </Button>
  );
}

function EditableField({
  icon, label, value, field, leadId, userId, validate, linkHref, placeholder, onSaved,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  field: "name" | "email" | "telefone" | "company" | "cargo";
  leadId: string;
  userId?: string;
  validate?: (v: string) => string | null;
  linkHref?: string;
  placeholder?: string;
  onSaved?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(value); }, [value]);

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (trimmed === (value || "").trim()) { setEditing(false); return; }
    const err = validate?.(trimmed);
    if (err) { toast.error(err); return; }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("leads")
        .update({ [field]: trimmed, last_activity_at: now } as any)
        .eq("id", leadId);
      if (error) throw error;
      if (userId) {
        await supabase.from("lead_activities").insert({
          lead_id: leadId,
          user_id: userId,
          activity_type: "lead_editado",
          content: `${label} alterado: "${value || "—"}" → "${trimmed || "—"}"`,
          metadata: { field, from: value, to: trimmed } as any,
        });
      }
      toast.success("Atualizado!");
      setEditing(false);
      onSaved?.();
    } catch (e: any) {
      toast.error("Erro ao salvar: " + (e.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const display = value || placeholder || "—";

  return (
    <div className="flex items-center gap-2 text-sm group min-h-[28px]">
      {linkHref && !editing ? (
        <a href={linkHref} target="_blank" rel="noopener noreferrer" className="text-muted-foreground shrink-0 hover:text-primary transition-colors" title={`Abrir ${label}`}>
          {icon}
        </a>
      ) : (
        <span className="text-muted-foreground shrink-0">{icon}</span>
      )}
      <span className="text-muted-foreground text-xs w-16 shrink-0">{label}</span>
      {editing ? (
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleSave(); }
              else if (e.key === "Escape") { e.preventDefault(); setDraft(value); setEditing(false); }
            }}
            disabled={saving}
            className="h-7 text-xs flex-1"
          />
          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" disabled={saving} onClick={handleSave} title="Salvar">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" disabled={saving} onClick={() => { setDraft(value); setEditing(false); }} title="Cancelar">
            <XIcon className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex items-center gap-1 flex-1 min-w-0 text-left hover:text-primary transition-colors"
          title={`Editar ${label}`}
        >
          <span className={cn("truncate", !value && "italic text-muted-foreground")}>{display}</span>
          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </button>
      )}
    </div>
  );
}

function DeleteLeadButton({ leadId, leadLabel, onDeleted }: { leadId: string; leadLabel: string; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("leads").delete().eq("id", leadId);
      if (error) throw error;
      toast.success("Lead excluído");
      setOpen(false);
      onDeleted();
    } catch (e: any) {
      toast.error("Erro ao excluir: " + (e.message || ""));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="justify-start gap-2 h-9 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            onClick={() => setOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </TooltipTrigger>
        <TooltipContent>Excluir lead permanentemente (admin)</TooltipContent>
      </Tooltip>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lead permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              O lead "{leadLabel}" e todas as atividades vinculadas serão removidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default LeadDrawer;

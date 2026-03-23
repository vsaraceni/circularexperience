import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Mail, Phone, Briefcase, Calendar, Tag, User,
  Send, FileText, Linkedin, MessageSquare, CheckCircle, XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
}

const LeadDrawer: React.FC<LeadDrawerProps> = ({ lead, open, onOpenChange, onQuickAction }) => {
  if (!lead) return null;

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
            <UrgencyBadge lastActivityAt={lead.last_activity_at || null} />
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
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Criado em"
                value={format(new Date(lead.created_at), "dd MMM yyyy", { locale: ptBR })}
              />
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
                  <>
                    <ActionBtn icon={<Send />} label={lead.welcome_sent ? "Reenviar Welcome" : "Enviar Welcome"} onClick={() => onQuickAction(lead, "send_welcome")} />
                    <ActionBtn icon={<FileText />} label="Gerar Proposta" onClick={() => onQuickAction(lead, "generate_proposal")} />
                  </>
                )}
                {lead.kanban_stage === "boas_vindas" && (
                  <>
                    <ActionBtn icon={<Linkedin />} label="LinkedIn" onClick={() => onQuickAction(lead, "linkedin")} />
                    <ActionBtn icon={<MessageSquare />} label="WhatsApp" onClick={() => onQuickAction(lead, "whatsapp")} />
                    <ActionBtn icon={<FileText />} label="Gerar Proposta" onClick={() => onQuickAction(lead, "generate_proposal")} />
                  </>
                )}
                {["em_contato", "call_agendada"].includes(lead.kanban_stage) && (
                  <ActionBtn icon={<FileText />} label="Gerar Proposta" onClick={() => onQuickAction(lead, "generate_proposal")} />
                )}
                {["proposta", "nutricao"].includes(lead.kanban_stage) && (
                  <>
                    <ActionBtn icon={<CheckCircle />} label="Fechar" onClick={() => onQuickAction(lead, "close_won")} variant="default" />
                    <ActionBtn icon={<XCircle />} label="Perdido" onClick={() => onQuickAction(lead, "mark_lost")} variant="destructive" />
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="atividades" className="mt-4">
            <ActivityTimeline leadId={lead.id} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

function InfoRow({
  icon, label, value, linkedin, company, whatsapp,
}: {
  icon: React.ReactNode; label: string; value: string;
  linkedin?: string; company?: string; whatsapp?: string;
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

  return content;
}

function ActionBtn({
  icon, label, onClick, variant = "outline",
}: {
  icon: React.ReactNode; label: string; onClick: () => void; variant?: "outline" | "default" | "destructive";
}) {
  return (
    <Button variant={variant} size="sm" className="justify-start gap-2 h-9" onClick={onClick}>
      {icon}
      {label}
    </Button>
  );
}

export default LeadDrawer;

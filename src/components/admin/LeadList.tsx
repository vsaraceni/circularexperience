import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Mail, Building2, Briefcase, Calendar, Tag, User, Phone,
  Send, CheckCircle, Loader2, Pencil, Archive, MessageSquare,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LeadEditDialog from "./LeadEditDialog";

export interface Lead {
  id: string;
  name: string;
  email: string;
  cargo: string;
  company: string;
  telefone: string;
  status: string;
  created_at: string;
  origem: string;
  welcome_sent: boolean;
  welcome_sent_at?: string | null;
  mensagem?: string | null;
  kanban_stage: string;
  assigned_to?: string | null;
  assigned_at?: string | null;
  stage_updated_at?: string | null;
  last_activity_at?: string | null;
  linkedin_added?: boolean;
  whatsapp_sent?: boolean;
  lost_reason?: string | null;
  lost_notes?: string | null;
  closed_at?: string | null;
  company_website?: string | null;
  company_description?: string | null;
  call_date?: string | null;
  briefing_notes?: string | null;
  colaboradores?: string | null;
}

interface AuthorDefaults {
  author_name: string;
  author_email: string;
  author_phone: string;
}

interface LeadListProps {
  leads: Lead[];
  onGenerateProposal: (lead: Lead) => void;
  onLeadUpdated?: () => void;
  authorDefaults?: AuthorDefaults;
}

const LeadList: React.FC<LeadListProps> = ({ leads, onGenerateProposal, onLeadUpdated, authorDefaults }) => {
  const [sendingWelcome, setSendingWelcome] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const handleSendWelcome = async (lead: Lead) => {
    setSendingWelcome(lead.id);
    try {
      const { data, error } = await supabase.functions.invoke("send-welcome-email", {
        body: {
          lead_id: lead.id,
          name: lead.name,
          email: lead.email,
          company: lead.company,
          cargo: lead.cargo,
          sender_name: authorDefaults?.author_name || "",
          sender_email: authorDefaults?.author_email || "",
          sender_phone: authorDefaults?.author_phone || "",
        },
      });

      if (error) throw error;
      if (data?.success) {
        toast.success(data.skipped ? "E-mail já havia sido enviado" : "E-mail de boas-vindas enviado!");
        onLeadUpdated?.();
      } else {
        throw new Error(data?.error || "Erro desconhecido");
      }
    } catch (err: any) {
      console.error("Error sending welcome:", err);
      toast.error("Erro ao enviar e-mail: " + (err.message || "Tente novamente"));
    } finally {
      setSendingWelcome(null);
    }
  };

  const handleArchive = async (lead: Lead) => {
    setArchiving(lead.id);
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: "archived" })
        .eq("id", lead.id);
      if (error) throw error;
      toast.success("Lead arquivado!");
      onLeadUpdated?.();
    } catch (err: any) {
      toast.error("Erro ao arquivar: " + (err.message || "Tente novamente"));
    } finally {
      setArchiving(null);
    }
  };

  if (leads.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Mail className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="text-lg">Nenhum lead novo.</p>
        <p className="text-sm mt-1">Os leads do formulário da LP aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">{lead.company || "Sem empresa"}</h3>
                <Badge variant={lead.status === "new" ? "default" : "secondary"} className="text-xs shrink-0">
                  {lead.status === "new" ? "Novo" : lead.status}
                </Badge>
                {lead.welcome_sent && (
                  <Badge variant="outline" className="text-xs shrink-0 gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {lead.welcome_sent_at
                      ? `Welcome enviado em ${new Date(lead.welcome_sent_at).toLocaleDateString("pt-BR")}`
                      : "Welcome enviado"}
                  </Badge>
                )}
                {lead.mensagem && lead.mensagem.trim() !== "" && (
                  <Badge variant="outline" className="text-xs shrink-0 gap-1 border-accent text-accent-foreground">
                    <MessageSquare className="h-3 w-3" />
                    Mensagem
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <a
                  href={`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(`${lead.name} ${lead.company || ""}`.trim())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  {lead.name}
                </a>
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {lead.email}
                </span>
                {lead.telefone && (
                  <a
                    href={`https://wa.me/${lead.telefone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {lead.telefone}
                  </a>
                )}
                {lead.cargo && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {lead.cargo}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                </span>
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  {lead.origem}
                </span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                onClick={() => { setEditLead(lead); setEditOpen(true); }}
                size="sm"
                variant="ghost"
                title="Editar lead"
              >
                <Pencil className="h-4 w-4" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Arquivar lead"
                    disabled={archiving === lead.id}
                  >
                    {archiving === lead.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Arquivar lead?</AlertDialogTitle>
                    <AlertDialogDescription>
                      O lead "{lead.company || lead.name}" será movido para arquivados e não aparecerá mais na lista.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleArchive(lead)}>Arquivar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                onClick={() => handleSendWelcome(lead)}
                size="sm"
                variant="outline"
                disabled={sendingWelcome === lead.id}
              >
                {sendingWelcome === lead.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                {lead.welcome_sent ? "Reenviar" : "Boas-Vindas"}
              </Button>
              <Button
                onClick={() => onGenerateProposal(lead)}
                size="sm"
              >
                <FileText className="h-4 w-4 mr-1" />
                Gerar Proposta
              </Button>
            </div>
          </div>
        ))}
      </div>

      <LeadEditDialog
        lead={editLead}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={() => onLeadUpdated?.()}
      />
    </>
  );
};

export default LeadList;

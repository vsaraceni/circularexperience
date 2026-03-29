import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getTemplatesForStage,
  replaceVariables,
  hasManualVariables,
  MANUAL_VARIABLES,
  CHANNEL_CONFIG,
  type MessageTemplate,
} from "./messageTemplates";
import type { Lead } from "./LeadList";

const STAGE_LABELS: Record<string, string> = {
  novo: "Novo",
  boas_vindas: "Boas-Vindas",
  em_contato: "Em Contato",
  call_agendada: "Call Agendada",
  proposta: "Proposta",
  nutricao: "Nutrição",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  userId?: string;
  assignedProfile?: { full_name: string | null; cargo?: string | null } | null;
  onActivity?: () => void;
}

const MessageTemplatesDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  lead,
  userId,
  assignedProfile,
  onActivity,
}) => {
  const templates = getTemplatesForStage(lead.kanban_stage);
  const [edits, setEdits] = useState<Record<string, string>>({});

  const getFilledBody = useCallback(
    (t: MessageTemplate) => replaceVariables(t.body, lead, assignedProfile),
    [lead, assignedProfile]
  );

  const getCurrentText = (t: MessageTemplate) => edits[t.id] ?? getFilledBody(t);

  const handleEdit = (id: string, value: string) => {
    setEdits((prev) => ({ ...prev, [id]: value }));
  };

  const handleRestore = (t: MessageTemplate) => {
    setEdits((prev) => {
      const next = { ...prev };
      delete next[t.id];
      return next;
    });
  };

  const handleCopy = async (t: MessageTemplate) => {
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
        await supabase
          .from("leads")
          .update({ last_activity_at: new Date().toISOString() })
          .eq("id", lead.id);
        onActivity?.();
      } catch {
        // silent
      }
    }
  };

  // Render manual variables highlighted
  const renderHighlightedText = (text: string) => {
    const parts: (string | { variable: string })[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      let earliest = -1;
      let earliestVar = "";
      for (const v of MANUAL_VARIABLES) {
        const idx = remaining.indexOf(v);
        if (idx !== -1 && (earliest === -1 || idx < earliest)) {
          earliest = idx;
          earliestVar = v;
        }
      }
      if (earliest === -1) {
        parts.push(remaining);
        break;
      }
      if (earliest > 0) parts.push(remaining.slice(0, earliest));
      parts.push({ variable: earliestVar });
      remaining = remaining.slice(earliest + earliestVar.length);
    }

    return (
      <span>
        {parts.map((p, i) =>
          typeof p === "string" ? (
            <span key={i}>{p}</span>
          ) : (
            <span
              key={i}
              className="bg-amber-200/60 dark:bg-amber-700/40 text-amber-800 dark:text-amber-200 rounded px-0.5 font-medium"
            >
              {p.variable.replace(/\{\{|\}\}/g, "")}
            </span>
          )
        )}
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Mensagens — {STAGE_LABELS[lead.kanban_stage] || lead.kanban_stage}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {lead.name} · {lead.company || "Sem empresa"}
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {templates.map((t) => {
            const isEdited = t.id in edits;
            const channelCfg = CHANNEL_CONFIG[t.channel];
            const currentText = getCurrentText(t);

            return (
              <div key={t.id} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${channelCfg.color}`}
                  >
                    {channelCfg.label}
                  </span>
                  <span className="text-sm font-medium text-foreground flex-1">{t.title}</span>
                  {isEdited && (
                    <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                      editado
                    </span>
                  )}
                </div>

                {t.subject && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Assunto:</span> {t.subject}
                  </p>
                )}

                <Textarea
                  value={currentText}
                  onChange={(e) => handleEdit(t.id, e.target.value)}
                  className="text-xs min-h-[100px] font-mono leading-relaxed resize-y"
                />

                {!isEdited && hasManualVariables(currentText) && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Campos destacados precisam ser preenchidos antes de enviar
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => handleCopy(t)}
                  >
                    <Copy className="h-3 w-3" />
                    Copiar
                  </Button>
                  {isEdited && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleRestore(t)}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restaurar original
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageTemplatesDialog;

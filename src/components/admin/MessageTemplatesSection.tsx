import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
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
import MessageTemplatesDialog from "./MessageTemplatesDialog";

interface MessageTemplatesSectionProps {
  lead: Lead;
  userId?: string;
  assignedProfile?: { full_name: string | null; cargo?: string | null } | null;
  onActivity?: () => void;
}

const MessageTemplatesSection: React.FC<MessageTemplatesSectionProps> = ({
  lead,
  userId,
  assignedProfile,
  onActivity,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const templates = getTemplatesForStage(lead.kanban_stage);

  if (templates.length === 0) return null;

  const first = templates[0];
  const filledBody = replaceVariables(first.body, lead, assignedProfile);
  const preview = filledBody.split("\n").slice(0, 2).join(" ").slice(0, 120);

  const handleCopy = async (template: MessageTemplate) => {
    const text = replaceVariables(template.body, lead, assignedProfile);
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

    // Log activity
    if (userId) {
      try {
        await supabase.from("lead_activities").insert({
          lead_id: lead.id,
          user_id: userId,
          activity_type: "template_copiado",
          content: `Template copiado: ${template.title}`,
          metadata: { template_id: template.id, channel: template.channel } as any,
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

  const channelCfg = CHANNEL_CONFIG[first.channel];

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Mensagens
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1"
            onClick={() => setDialogOpen(true)}
          >
            Ver todas ({templates.length})
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>

        <div className="border border-border rounded-lg p-3 space-y-2 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${channelCfg.color}`}>
              {channelCfg.label}
            </span>
            <span className="text-xs font-medium text-foreground">{first.title}</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{preview}...</p>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => handleCopy(first)}
          >
            <Copy className="h-3 w-3" />
            Copiar
          </Button>
        </div>
      </div>

      <MessageTemplatesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={lead}
        userId={userId}
        assignedProfile={assignedProfile}
        onActivity={onActivity}
      />
    </>
  );
};

export default MessageTemplatesSection;

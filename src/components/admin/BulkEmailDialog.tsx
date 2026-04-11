import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Loader2, Copy } from "lucide-react";
import RichTextEditor from "./RichTextEditor";

interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  kanban_stage: string;
}

interface BulkEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  userId: string;
}

const VARIABLES = [
  { tag: "{{name}}", label: "Primeiro nome" },
  { tag: "{{full_name}}", label: "Nome completo" },
  { tag: "{{email}}", label: "Email" },
  { tag: "{{company}}", label: "Empresa" },
  { tag: "{{cargo}}", label: "Cargo" },
  { tag: "{{sender_name}}", label: "Seu nome" },
  { tag: "{{sender_email}}", label: "Seu email" },
  { tag: "{{sender_phone}}", label: "Seu telefone" },
];

const BulkEmailDialog: React.FC<BulkEmailDialogProps> = ({ open, onOpenChange, leads, userId }) => {
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [sending, setSending] = useState(false);

  const handleCopyVariable = (tag: string) => {
    navigator.clipboard.writeText(tag);
    toast.success(`${tag} copiado`);
  };

  const handleSend = async () => {
    if (!subject.trim()) { toast.error("Preencha o assunto"); return; }
    if (!bodyHtml.trim() || bodyHtml === "<p></p>") { toast.error("Preencha a mensagem"); return; }
    if (leads.length === 0) { toast.error("Nenhum lead selecionado"); return; }
    if (leads.length > 50) { toast.error("Máximo de 50 leads por envio"); return; }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-bulk-email", {
        body: {
          lead_ids: leads.map(l => l.id),
          subject: subject.trim(),
          body_html: bodyHtml,
        },
      });

      if (error) throw error;

      const sent = data?.sent || 0;
      const failed = data?.failed || 0;
      const suppressed = data?.suppressed || 0;

      let msg = `✅ ${sent} email${sent !== 1 ? "s" : ""} enviado${sent !== 1 ? "s" : ""}`;
      if (suppressed > 0) msg += ` · ${suppressed} suprimido${suppressed !== 1 ? "s" : ""}`;
      if (failed > 0) msg += ` · ${failed} falha${failed !== 1 ? "s" : ""}`;

      toast.success(msg, { duration: 8000 });
      onOpenChange(false);
      setSubject("");
      setBodyHtml("");
    } catch (err: any) {
      toast.error("Erro ao enviar: " + (err.message || "Erro desconhecido"));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" style={{ color: 'hsl(var(--color-brand))' }} />
            Enviar email em massa
          </DialogTitle>
          <DialogDescription>
            Enviar para {leads.length} lead{leads.length !== 1 ? "s" : ""} filtrado{leads.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="bulk-subject">Assunto</Label>
            <Input
              id="bulk-subject"
              placeholder="Ex: Novidades sobre o Movimento Circular"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              maxLength={200}
            />
          </div>

          <div>
            <Label>Mensagem</Label>
            <RichTextEditor
              value={bodyHtml}
              onChange={setBodyHtml}
              placeholder="Escreva a mensagem..."
            />
          </div>

          <div>
            <Label className="text-xs mb-1 block" style={{ color: 'hsl(var(--color-text-muted))' }}>
              Variáveis disponíveis <span className="font-normal">(clique para copiar)</span>
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map(v => (
                <Badge
                  key={v.tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent transition-colors text-[11px] gap-1"
                  onClick={() => handleCopyVariable(v.tag)}
                >
                  <Copy className="h-3 w-3" />
                  {v.tag} <span className="font-normal opacity-70">— {v.label}</span>
                </Badge>
              ))}
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--color-text-muted))' }}>
              Variáveis são substituídas automaticamente para cada lead
            </p>
          </div>

          <div className="text-[11px] space-y-1 p-3 rounded-lg" style={{ background: 'hsl(var(--color-bg-page))', color: 'hsl(var(--color-text-muted))' }}>
            <p>• Máximo de 50 leads por envio</p>
            <p>• Emails suprimidos (bounce/unsubscribe) são ignorados automaticamente</p>
            <p>• Cada envio é registrado na timeline do lead</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !bodyHtml.trim()}
            style={{ background: 'hsl(var(--color-brand))', color: 'white' }}
          >
            {sending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
            ) : (
              <>Enviar para {leads.length} lead{leads.length !== 1 ? "s" : ""}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEmailDialog;

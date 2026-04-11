import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Loader2, Copy, CheckCircle2, XCircle, Ban } from "lucide-react";
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

interface SendProgress {
  current: number;
  total: number;
  sent: number;
  failed: number;
  suppressed: number;
  done: boolean;
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
  const [progress, setProgress] = useState<SendProgress | null>(null);
  const abortRef = useRef(false);

  const handleCopyVariable = (tag: string) => {
    navigator.clipboard.writeText(tag);
    toast.success(`${tag} copiado`);
  };

  const handleSend = async () => {
    if (!subject.trim()) { toast.error("Preencha o assunto"); return; }
    if (!bodyHtml.trim() || bodyHtml === "<p></p>") { toast.error("Preencha a mensagem"); return; }
    if (leads.length === 0) { toast.error("Nenhum lead selecionado"); return; }

    abortRef.current = false;
    const total = leads.length;
    setProgress({ current: 0, total, sent: 0, failed: 0, suppressed: 0, done: false });

    let sent = 0;
    let failed = 0;
    let suppressed = 0;

    // Send in small batches to the edge function (1 lead at a time for progress)
    for (let i = 0; i < leads.length; i++) {
      if (abortRef.current) break;

      setProgress(p => p ? { ...p, current: i + 1 } : p);

      try {
        const { data, error } = await supabase.functions.invoke("send-bulk-email", {
          body: {
            lead_ids: [leads[i].id],
            subject: subject.trim(),
            body_html: bodyHtml,
          },
        });

        if (error) throw error;

        sent += data?.sent || 0;
        failed += data?.failed || 0;
        suppressed += data?.suppressed || 0;
      } catch {
        failed += 1;
      }

      setProgress({ current: i + 1, total, sent, failed, suppressed, done: false });
    }

    setProgress({ current: total, total, sent, failed, suppressed, done: true });

    let msg = `✅ ${sent} email${sent !== 1 ? "s" : ""} enviado${sent !== 1 ? "s" : ""}`;
    if (suppressed > 0) msg += ` · ${suppressed} suprimido${suppressed !== 1 ? "s" : ""}`;
    if (failed > 0) msg += ` · ${failed} falha${failed !== 1 ? "s" : ""}`;
    if (abortRef.current) msg += " (cancelado)";
    toast.success(msg, { duration: 8000 });
  };

  const handleClose = () => {
    if (progress && !progress.done) {
      abortRef.current = true;
      return;
    }
    setProgress(null);
    setSubject("");
    setBodyHtml("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    abortRef.current = true;
  };

  const pct = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" style={{ color: 'hsl(var(--color-brand))' }} />
            Enviar email em massa
          </DialogTitle>
          <DialogDescription>
            {progress
              ? (progress.done
                ? "Envio finalizado"
                : `Enviando ${progress.current} de ${progress.total}...`)
              : `Enviar para ${leads.length} lead${leads.length !== 1 ? "s" : ""} filtrado${leads.length !== 1 ? "s" : ""}`}
          </DialogDescription>
        </DialogHeader>

        {progress ? (
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'hsl(var(--color-text-secondary))' }}>
                  {progress.done
                    ? (abortRef.current ? "Envio cancelado" : "Envio concluído!")
                    : `Enviando email ${progress.current} de ${progress.total}...`}
                </span>
                <span className="font-mono text-xs" style={{ color: 'hsl(var(--color-text-muted))' }}>
                  {pct}%
                </span>
              </div>
              <Progress value={pct} className="h-3" />
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span style={{ color: 'hsl(var(--color-text-secondary))' }}>
                  Enviados: <strong>{progress.sent}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-red-500" />
                <span style={{ color: 'hsl(var(--color-text-secondary))' }}>
                  Falhas: <strong>{progress.failed}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Ban className="h-4 w-4" style={{ color: 'hsl(var(--color-text-muted))' }} />
                <span style={{ color: 'hsl(var(--color-text-secondary))' }}>
                  Suprimidos: <strong>{progress.suppressed}</strong>
                </span>
              </div>
            </div>

            {!progress.done && (
              <p className="text-[11px] animate-pulse" style={{ color: 'hsl(var(--color-text-muted))' }}>
                Não feche esta janela durante o envio
              </p>
            )}

            <DialogFooter>
              {progress.done ? (
                <Button onClick={handleClose}>Fechar</Button>
              ) : (
                <Button variant="destructive" onClick={handleCancel}>
                  Cancelar envio
                </Button>
              )}
            </DialogFooter>
          </div>
        ) : (
          <>
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
                <p>• Emails suprimidos (bounce/unsubscribe) são ignorados automaticamente</p>
                <p>• Cada envio é registrado na timeline do lead</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSend}
                disabled={!subject.trim() || !bodyHtml.trim()}
                style={{ background: 'hsl(var(--color-brand))', color: 'white' }}
              >
                Enviar para {leads.length} lead{leads.length !== 1 ? "s" : ""}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkEmailDialog;

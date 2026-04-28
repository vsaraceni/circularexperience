import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  apiKey: string;
  isRotation?: boolean;
  graceUntil?: string;
}

export default function IntegrationKeyDialog({ open, onOpenChange, apiKey, isRotation, graceUntil }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast.success("Chave copiada");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isRotation ? "Nova chave gerada" : "Integração criada"}</DialogTitle>
          <DialogDescription>
            Copie agora — esta chave <strong>não será exibida novamente</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 p-3 font-mono text-sm break-all">
          {apiKey}
        </div>

        <Button onClick={handleCopy} className="w-full">
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? "Copiado" : "Copiar chave"}
        </Button>

        {isRotation && graceUntil && (
          <div className="flex gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Chave anterior ainda funciona</p>
              <p className="text-amber-800 text-xs mt-0.5">
                A chave antiga continua válida até {new Date(graceUntil).toLocaleString("pt-BR")}.
                Atualize a integração antes desse prazo.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
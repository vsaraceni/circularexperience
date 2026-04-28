import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Clock } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sourceName: string;
  onConfirm: () => Promise<void>;
}

export default function RotateKeyDialog({ open, onOpenChange, sourceName, onConfirm }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const handle = async () => {
    setSubmitting(true);
    try { await onConfirm(); } finally { setSubmitting(false); }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rotacionar chave de "{sourceName}"?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>Uma nova chave será gerada e exibida apenas uma vez.</p>
              <div className="flex gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm">
                <Clock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-blue-900">
                  <strong>Período de graça de 24h:</strong> a chave atual continuará válida por 24h
                  para você atualizar a integração sem derrubar o canal.
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handle} disabled={submitting}>
            {submitting ? "Rotacionando..." : "Rotacionar chave"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
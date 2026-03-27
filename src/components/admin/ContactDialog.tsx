import { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (content: string) => void;
  leadName: string;
}

const ContactDialog: React.FC<ContactDialogProps> = ({ open, onOpenChange, onConfirm, leadName }) => {
  const [content, setContent] = useState("");

  const handleConfirm = () => {
    onConfirm(content);
    setContent("");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Registrar Contato</AlertDialogTitle>
          <AlertDialogDescription>
            O que foi feito com "{leadName}"?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <Label>Descrição do contato</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ex: Ligação para alinhar datas, follow-up por e-mail..."
            rows={3}
            className="mt-1"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={!content.trim()}>Salvar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ContactDialog;

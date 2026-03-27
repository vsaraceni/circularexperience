import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (sentAt: Date, channels: string[], notes: string) => void;
  leadName: string;
}

const SubmissionDialog: React.FC<SubmissionDialogProps> = ({ open, onOpenChange, onConfirm, leadName }) => {
  const [sentAt, setSentAt] = useState<Date>(new Date());
  const [emailChecked, setEmailChecked] = useState(false);
  const [whatsappChecked, setWhatsappChecked] = useState(false);
  const [notes, setNotes] = useState("");

  const channels = [
    ...(emailChecked ? ["email"] : []),
    ...(whatsappChecked ? ["whatsapp"] : []),
  ];
  const canConfirm = channels.length > 0;

  const handleConfirm = () => {
    onConfirm(sentAt, channels, notes);
    setSentAt(new Date());
    setEmailChecked(false);
    setWhatsappChecked(false);
    setNotes("");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Registrar Envio de Proposta</AlertDialogTitle>
          <AlertDialogDescription>
            Registrar o envio da proposta para "{leadName}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Quando foi enviada?</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal mt-1", !sentAt && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {sentAt ? format(sentAt, "dd/MM/yyyy") : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={sentAt}
                  onSelect={(d) => d && setSentAt(d)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label className="mb-2 block">Canal de envio (obrigatório)</Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox id="ch-email" checked={emailChecked} onCheckedChange={(v) => setEmailChecked(!!v)} />
                <Label htmlFor="ch-email" className="text-sm font-normal">E-mail</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="ch-whatsapp" checked={whatsappChecked} onCheckedChange={(v) => setWhatsappChecked(!!v)} />
                <Label htmlFor="ch-whatsapp" className="text-sm font-normal">WhatsApp</Label>
              </div>
            </div>
          </div>
          <div>
            <Label>Observação</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalhes opcionais..." rows={3} className="mt-1" />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={!canConfirm}>Confirmar envio</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SubmissionDialog;

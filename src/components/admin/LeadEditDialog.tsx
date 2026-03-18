import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Lead } from "./LeadList";

interface LeadEditDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const LeadEditDialog: React.FC<LeadEditDialogProps> = ({ lead, open, onOpenChange, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    cargo: "",
    company: "",
    telefone: "",
    origem: "",
  });

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && lead) {
      setForm({
        name: lead.name || "",
        email: lead.email || "",
        cargo: lead.cargo || "",
        company: lead.company || "",
        telefone: lead.telefone || "",
        origem: lead.origem || "",
      });
    }
    onOpenChange(isOpen);
  };

  const handleSave = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          name: form.name,
          email: form.email,
          cargo: form.cargo,
          company: form.company,
          telefone: form.telefone,
          origem: form.origem,
        })
        .eq("id", lead.id);

      if (error) throw error;
      toast.success("Lead atualizado!");
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao atualizar: " + (err.message || "Tente novamente"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="edit-name">Nome</Label>
            <Input id="edit-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="edit-email">E-mail</Label>
            <Input id="edit-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="edit-company">Empresa</Label>
            <Input id="edit-company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="edit-cargo">Cargo</Label>
            <Input id="edit-cargo" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="edit-telefone">Telefone</Label>
            <Input id="edit-telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="edit-origem">Origem</Label>
            <Input id="edit-origem" value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeadEditDialog;

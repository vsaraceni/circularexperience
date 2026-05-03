import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Archive } from "lucide-react";
import HeatDots from "./HeatDots";
import { toE164, formatPhoneDisplay } from "@/lib/phone";
import type { Lead } from "./LeadList";

interface LeadEditDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const LeadEditDialog: React.FC<LeadEditDialogProps> = ({ lead, open, onOpenChange, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    cargo: "",
    company: "",
    telefone: "",
    origem: "",
    mensagem: "",
    lead_heat: null as number | null,
  });

  useEffect(() => {
    if (lead && open) {
      setForm({
        name: lead.name || "",
        email: lead.email || "",
        cargo: lead.cargo || "",
        company: lead.company || "",
        telefone: lead.telefone || "",
        origem: lead.origem || "",
        mensagem: lead.mensagem || "",
        lead_heat: lead.lead_heat ?? null,
      });
    }
  }, [lead, open]);

  const handleSave = async () => {
    if (!lead) return;
    let telefoneE164 = "";
    if (form.telefone.trim()) {
      const r = toE164(form.telefone);
      if (!r.ok) {
        toast.error("Telefone inválido. Use formato com DDD (ex.: +55 31 99724-6145)");
        return;
      }
      telefoneE164 = r.value;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          name: form.name,
          email: form.email,
          cargo: form.cargo,
          company: form.company,
          telefone: telefoneE164,
          origem: form.origem,
          mensagem: form.mensagem,
          lead_heat: form.lead_heat,
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

  const handleArchive = async () => {
    if (!lead) return;
    if (!window.confirm(`Arquivar o lead "${lead.company || lead.name}"? Ele será removido do Kanban.`)) return;

    setArchiving(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("leads")
        .update({ status: "archived", last_activity_at: now })
        .eq("id", lead.id);
      if (error) throw error;

      await supabase.from("lead_activities").insert({
        lead_id: lead.id,
        activity_type: "lead_arquivado",
        content: "Lead arquivado",
      });

      toast.success("Lead arquivado!");
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao arquivar: " + (err.message || ""));
    } finally {
      setArchiving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Input
              id="edit-telefone"
              value={form.telefone}
              placeholder="+55 (31) 99724-6145"
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              onBlur={(e) => {
                const r = toE164(e.target.value);
                if (r.ok) setForm((f) => ({ ...f, telefone: formatPhoneDisplay(r.value) }));
              }}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Salvo como E.164 (+país DDD número). Ex.: +5531997246145
            </p>
          </div>
          <div>
            <Label htmlFor="edit-origem">Origem</Label>
            <Input id="edit-origem" value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="edit-mensagem">Mensagem</Label>
            <Textarea id="edit-mensagem" value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })} rows={4} />
          </div>
          <div>
            <Label>Calor (Prioridade)</Label>
            <div className="mt-1">
              <HeatDots value={form.lead_heat} onChange={(v) => setForm({ ...form, lead_heat: v })} size="md" />
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleArchive}
            disabled={archiving}
            className="gap-1 sm:mr-auto"
          >
            {archiving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
            Arquivar Lead
          </Button>
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

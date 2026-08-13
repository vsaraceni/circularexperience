import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import HeatDots from "./HeatDots";
import { toE164 } from "@/lib/phone";
import { createManualLead } from "@/lib/manualLead";

const STAGES = [
  { value: "novo", label: "Novo" },
  { value: "boas_vindas", label: "Boas-Vindas" },
  { value: "em_contato", label: "Em Contato" },
  { value: "call_agendada", label: "Call Agendada" },
  { value: "proposta", label: "Proposta" },
  { value: "nutricao", label: "Nutrição" },
  { value: "tratativas", label: "Tratativas" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onCreated: (leadId: string) => void;
}

const NewLeadDialog: React.FC<Props> = ({ open, onOpenChange, userId, onCreated }) => {
  const [saving, setSaving] = useState(false);
  const [sources, setSources] = useState<{ slug: string; nome: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    telefone: "",
    company: "",
    cargo: "",
    origem: "",
    origem_detalhe: "",
    product_id: "",
    stage: "novo",
    mensagem: "",
    lead_heat: null as number | null,
    sendWelcome: false,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: "", email: "", telefone: "", company: "", cargo: "",
      origem: "", origem_detalhe: "", product_id: "", stage: "novo",
      mensagem: "", lead_heat: null, sendWelcome: false,
    });
    (async () => {
      const [srcRes, prodRes] = await Promise.all([
        supabase.rpc("list_active_lead_sources"),
        supabase.from("products").select("id, name").eq("is_active", true).order("sort_order"),
      ]);
      setSources((srcRes.data as any[]) || []);
      setProducts((prodRes.data as any[]) || []);
    })();
  }, [open]);

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error("Informe o nome do contato."); return; }
    if (!form.email.trim()) { toast.error("Informe o e-mail do contato."); return; }
    if (!form.origem) { toast.error("Selecione a origem do lead."); return; }

    let telefoneE164 = "";
    if (form.telefone.trim()) {
      const r = toE164(form.telefone);
      if (!r.ok) { toast.error("Telefone inválido. Use formato com DDD (ex.: +55 31 99724-6145)"); return; }
      telefoneE164 = r.value;
    }

    setSaving(true);
    try {
      // Aviso de duplicidade (não bloqueia, mas evita lead repetido sem querer)
      const orFilter = telefoneE164
        ? `email.eq.${form.email.trim()},telefone.eq.${telefoneE164}`
        : `email.eq.${form.email.trim()}`;
      const { data: dupes } = await supabase
        .from("leads")
        .select("id, name, company")
        .or(orFilter)
        .neq("status", "archived")
        .limit(1);

      if (dupes && dupes.length > 0) {
        const d = dupes[0] as any;
        const proceed = window.confirm(
          `Já existe um lead com esse contato: ${d.company || d.name}. Deseja criar mesmo assim?`,
        );
        if (!proceed) { setSaving(false); return; }
      }

      const created = await createManualLead({
        name: form.name.trim(),
        email: form.email.trim(),
        telefone: telefoneE164,
        company: form.company.trim(),
        cargo: form.cargo.trim(),
        origem: form.origem,
        origem_detalhe: form.origem_detalhe.trim() || null,
        product_id: form.product_id || null,
        mensagem: form.mensagem.trim() || null,
        lead_heat: form.lead_heat,
        assigned_to: userId,
        stage: form.stage,
        suppressWelcome: !(form.sendWelcome && form.stage === "novo"),
      });

      if ("error" in created) throw new Error(created.error);

      await supabase.from("lead_activities").insert({
        lead_id: created.id,
        user_id: userId,
        activity_type: "lead_criado_manual",
        content: "Lead criado manualmente no CRM",
      });

      toast.success("Lead criado!");
      onCreated(created.id);
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao criar lead: " + (err.message || "Tente novamente"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="nl-name">Nome *</Label>
              <Input id="nl-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="nl-email">E-mail *</Label>
              <Input id="nl-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="nl-phone">Telefone</Label>
              <Input id="nl-phone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="+55 11 90000-0000" />
            </div>
            <div>
              <Label htmlFor="nl-company">Empresa</Label>
              <Input id="nl-company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="nl-cargo">Cargo</Label>
              <Input id="nl-cargo" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
            </div>
            <div>
              <Label>Estágio inicial</Label>
              <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Origem *</Label>
              <Select value={form.origem} onValueChange={(v) => setForm({ ...form, origem: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione a origem" /></SelectTrigger>
                <SelectContent>
                  {sources.map((s) => <SelectItem key={s.slug} value={s.slug}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="nl-detalhe">Detalhe da origem</Label>
              <Input id="nl-detalhe" value={form.origem_detalhe} onChange={(e) => setForm({ ...form, origem_detalhe: e.target.value })} placeholder="Ex.: indicação da Ana / evento X" />
            </div>
          </div>

          <div>
            <Label>Produto</Label>
            <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Calor do lead</Label>
            <div className="mt-1">
              <HeatDots value={form.lead_heat} onChange={(v) => setForm({ ...form, lead_heat: v })} />
            </div>
          </div>

          <div>
            <Label htmlFor="nl-msg">Observação</Label>
            <Textarea id="nl-msg" value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })} rows={3} />
          </div>

          <div className="flex items-start justify-between gap-3 rounded-lg border p-3" style={{ borderColor: 'hsl(var(--color-border))' }}>
            <div>
              <Label htmlFor="nl-welcome" className="text-sm">Enviar boas-vindas automaticamente</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Desligado: você dispara o e-mail quando quiser, pelo card no Kanban. Só vale para o estágio "Novo".
              </p>
            </div>
            <Switch
              id="nl-welcome"
              checked={form.sendWelcome}
              disabled={form.stage !== "novo"}
              onCheckedChange={(v) => setForm({ ...form, sendWelcome: v })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Criar lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewLeadDialog;

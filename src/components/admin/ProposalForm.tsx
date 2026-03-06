import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/admin/RichTextEditor";
import type { Proposal } from "@/pages/admin/Proposals";

interface ProposalFormProps {
  proposal?: Proposal | null;
  onSave: (data: Partial<Proposal>) => void;
  onCancel: () => void;
}

const ProposalForm: React.FC<ProposalFormProps> = ({ proposal, onSave, onCancel }) => {
  const defaultValidity = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const [form, setForm] = useState({
    company_name: proposal?.company_name || "",
    contact_name: proposal?.contact_name || "",
    contact_role: proposal?.contact_role || "",
    event_date: proposal?.event_date || "",
    title: proposal?.title || "",
    scope: proposal?.scope || "",
    investment: proposal?.investment || "",
    considerations: proposal?.considerations || "",
    valid_until: proposal?.valid_until || defaultValidity,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h2 className="text-xl font-bold text-foreground mb-6">
        {proposal ? "Editar Proposta" : "Nova Proposta"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome da Empresa *</Label>
            <Input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Nome do Contato *</Label>
            <Input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Cargo</Label>
            <Input value={form.contact_role} onChange={(e) => set("contact_role", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Data do Evento</Label>
            <Input type="date" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Título da Proposta *</Label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label>Definição do Escopo</Label>
          <RichTextEditor
            value={form.scope}
            onChange={(html) => set("scope", html)}
            placeholder="Descreva o escopo do projeto..."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Investimento</Label>
            <Input value={form.investment} onChange={(e) => set("investment", e.target.value)} placeholder="R$ 0.000,00" />
          </div>
          <div className="space-y-2">
            <Label>Validade da Proposta</Label>
            <Input type="date" value={form.valid_until} onChange={(e) => set("valid_until", e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Considerações</Label>
          <RichTextEditor
            value={form.considerations}
            onChange={(html) => set("considerations", html)}
            placeholder="Considerações adicionais..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit">{proposal ? "Salvar Alterações" : "Criar Proposta"}</Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
};

export default ProposalForm;

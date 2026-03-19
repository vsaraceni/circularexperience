import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Copy } from "lucide-react";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import type { Proposal } from "@/pages/admin/Proposals";

interface RecentProposal {
  id: string;
  title: string;
  company_name: string;
  scope: string | null;
  considerations: string | null;
}

interface ImportButtonProps {
  field: "scope" | "considerations";
  proposals: RecentProposal[];
  onSelect: (value: string) => void;
}

const ImportButton: React.FC<ImportButtonProps> = ({ field, proposals, onSelect }) => {
  const [open, setOpen] = useState(false);
  const filtered = proposals.filter((p) => (field === "scope" ? p.scope : p.considerations));

  if (filtered.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1 text-muted-foreground">
          <Copy className="h-3 w-3" />
          Importar
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <p className="text-xs font-medium text-muted-foreground mb-2">Últimas propostas</p>
        <div className="space-y-1">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              className="w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors"
              onClick={() => {
                onSelect((field === "scope" ? p.scope : p.considerations) || "");
                setOpen(false);
              }}
            >
              <span className="font-medium block truncate">{p.title}</span>
              <span className="text-xs text-muted-foreground truncate block">{p.company_name}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface ProposalFormProps {
  proposal?: Proposal | null;
  onSave: (data: Partial<Proposal> & { lead_id?: string }) => void;
  onCancel: () => void;
  prefill?: {
    company_name?: string;
    contact_name?: string;
    contact_role?: string;
    lead_id?: string;
  };
  authorDefaults?: {
    author_name: string;
    author_email: string;
    author_phone: string;
  };
}

const ProposalForm: React.FC<ProposalFormProps> = ({ proposal, onSave, onCancel, prefill, authorDefaults }) => {
  const defaultValidity = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const [recentProposals, setRecentProposals] = useState<RecentProposal[]>([]);

  const [form, setForm] = useState({
    company_name: proposal?.company_name || prefill?.company_name || "",
    contact_name: proposal?.contact_name || prefill?.contact_name || "",
    contact_role: proposal?.contact_role || prefill?.contact_role || "",
    event_date: proposal?.event_date || new Date().toISOString().split("T")[0],
    title: proposal?.title || (prefill?.company_name ? `Proposta — ${prefill.company_name}` : ""),
    scope: proposal?.scope || "",
    investment: proposal?.investment || "",
    considerations: proposal?.considerations || "",
    valid_until: proposal?.valid_until || defaultValidity,
    author_name: proposal?.author_name || authorDefaults?.author_name || "",
    author_phone: proposal?.author_phone || authorDefaults?.author_phone || "",
    author_email: proposal?.author_email || authorDefaults?.author_email || "",
  });

  useEffect(() => {
    supabase
      .from("proposals")
      .select("id, title, company_name, scope, considerations")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setRecentProposals(data);
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { ...form };
    if (prefill?.lead_id && !proposal) {
      data.lead_id = prefill.lead_id;
    }
    onSave(data);
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
          <div className="flex items-center gap-2">
            <Label>Definição do Escopo</Label>
            <ImportButton field="scope" proposals={recentProposals} onSelect={(v) => set("scope", v)} />
          </div>
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
          <div className="flex items-center gap-2">
            <Label>Considerações</Label>
            <ImportButton field="considerations" proposals={recentProposals} onSelect={(v) => set("considerations", v)} />
          </div>
          <RichTextEditor
            value={form.considerations}
            onChange={(html) => set("considerations", html)}
            placeholder="Considerações adicionais..."
          />
        </div>

        <div className="border-t border-border pt-4 mt-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Assinatura</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nome do Responsável</Label>
              <Input value={form.author_name} onChange={(e) => set("author_name", e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.author_phone} onChange={(e) => set("author_phone", e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={form.author_email} onChange={(e) => set("author_email", e.target.value)} placeholder="email@exemplo.com" />
            </div>
          </div>
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

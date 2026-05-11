import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Search, FileText, ChevronDown, Package, Sparkles } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import type { Proposal } from "@/pages/admin/Proposals";

interface ProductOption {
  id: string;
  slug: string;
  name: string;
  default_title_template?: string | null;
  default_scope?: string | null;
  default_considerations?: string | null;
}

interface MasterOption {
  id: string;
  product_id: string;
  version: string;
  label: string | null;
  is_active: boolean;
  uploaded_at: string;
}

interface RecentProposal {
  id: string;
  title: string;
  company_name: string;
  scope: string | null;
  considerations: string | null;
  created_at: string | null;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function relativeDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}sem`;
  return `${Math.floor(days / 30)}m`;
}

interface ImportButtonProps {
  field: "scope" | "considerations";
  proposals: RecentProposal[];
  onSelect: (value: string) => void;
}

const ImportButton: React.FC<ImportButtonProps> = ({ field, proposals, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [remoteResults, setRemoteResults] = useState<RecentProposal[]>([]);
  const [searching, setSearching] = useState(false);

  const filtered = useMemo(() => {
    const withContent = proposals.filter((p) => (field === "scope" ? p.scope : p.considerations));
    if (!search.trim()) return withContent;
    const term = search.toLowerCase();
    return withContent.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.company_name.toLowerCase().includes(term)
    );
  }, [proposals, field, search]);

  // Remote fallback when local filter yields no results and search >= 3 chars
  useEffect(() => {
    if (search.length < 3 || filtered.length > 0) {
      setRemoteResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      const col = field === "scope" ? "scope" : "considerations";
      const { data } = await supabase
        .from("proposals")
        .select("id, title, company_name, scope, considerations, created_at")
        .or(`title.ilike.%${search}%,company_name.ilike.%${search}%`)
        .not(col, "is", null)
        .order("created_at", { ascending: false })
        .limit(10);
      setRemoteResults(data || []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, filtered.length, field]);

  const displayList = filtered.length > 0 ? filtered : remoteResults;

  if (proposals.filter((p) => (field === "scope" ? p.scope : p.considerations)).length === 0) return null;

  return (
    <TooltipProvider delayDuration={400}>
      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(""); }}>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1 text-muted-foreground">
            <Copy className="h-3 w-3" />
            Importar
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por empresa ou título..."
                className="h-8 pl-7 text-xs"
                autoFocus
              />
            </div>
          </div>
          <ScrollArea className="max-h-[280px]">
            <div className="p-1">
              {displayList.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {searching ? "Buscando..." : "Nenhuma proposta encontrada"}
                </p>
              )}
              {displayList.map((p) => {
                const content = (field === "scope" ? p.scope : p.considerations) || "";
                const preview = stripHtml(content).slice(0, 120);
                return (
                  <Tooltip key={p.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors flex items-start justify-between gap-2"
                        onClick={() => {
                          onSelect(content);
                          setOpen(false);
                          setSearch("");
                          toast.success("Conteúdo importado");
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-medium block truncate">{p.title}</span>
                          <span className="text-xs text-muted-foreground truncate block">{p.company_name}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">
                          {relativeDate(p.created_at)}
                        </span>
                      </button>
                    </TooltipTrigger>
                    {preview && (
                      <TooltipContent side="right" className="max-w-[240px] text-xs">
                        {preview}{preview.length >= 120 ? "..." : ""}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
};

interface ProposalFormProps {
  proposal?: Proposal | null;
  onSave: (data: Partial<Proposal> & { lead_id?: string; manual_origin?: ManualOriginInput }) => void;
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

export interface ManualOriginInput {
  email: string;
  telefone: string;
  origem: string;
  origem_detalhe: string;
}

interface SourceOption {
  slug: string;
  nome: string;
}

const ProposalForm: React.FC<ProposalFormProps> = ({ proposal, onSave, onCancel, prefill, authorDefaults }) => {
  const defaultValidity = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const [recentProposals, setRecentProposals] = useState<RecentProposal[]>([]);
  const [briefingNotes, setBriefingNotes] = useState<string>("");
  const [briefingOpen, setBriefingOpen] = useState(true);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [masters, setMasters] = useState<MasterOption[]>([]);
  const [sources, setSources] = useState<SourceOption[]>([]);

  // Quando NÃO há lead vinculado e não estamos editando, exigimos dados reais de origem.
  const requiresManualOrigin = !proposal && !prefill?.lead_id;

  const [manualOrigin, setManualOrigin] = useState<ManualOriginInput>({
    email: "",
    telefone: "",
    origem: "",
    origem_detalhe: "",
  });

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
    product_id: (proposal as any)?.product_id || "",
    master_asset_id: (proposal as any)?.master_asset_id || "",
  });

  // Fetch products + masters once
  useEffect(() => {
    (async () => {
      const [{ data: prodData }, { data: masterData }, { data: srcData }] = await Promise.all([
        supabase.from("products").select("id, slug, name, default_title_template, default_scope, default_considerations").eq("is_active", true).order("sort_order"),
        supabase.from("proposal_master_assets").select("id, product_id, version, label, is_active, uploaded_at").order("uploaded_at", { ascending: false }),
        supabase.from("lead_sources").select("slug, nome").eq("ativo", true).order("nome"),
      ]);
      const prods = (prodData || []) as ProductOption[];
      const mstrs = (masterData || []) as MasterOption[];
      setProducts(prods);
      setMasters(mstrs);
      setSources(((srcData || []) as SourceOption[]));

      // Smart defaults for new proposals only
      if (!proposal && !form.product_id) {
        // Default to single active product, or to circular-experience if multiple
        const defaultProd = prods.length === 1 ? prods[0] : prods.find(p => p.slug === "circular-experience") || prods[0];
        if (defaultProd) {
          const activeMaster = mstrs.find(m => m.product_id === defaultProd.id && m.is_active);
          setForm(f => {
            const next: typeof f = { ...f, product_id: defaultProd.id, master_asset_id: activeMaster?.id || "" };
            // Apply template defaults only to empty fields
            if (!f.title.trim() && defaultProd.default_title_template) {
              next.title = defaultProd.default_title_template.replace(/\{\{empresa\}\}/g, f.company_name || "");
            }
            if (!stripHtml(f.scope) && defaultProd.default_scope) next.scope = defaultProd.default_scope;
            if (!stripHtml(f.considerations) && defaultProd.default_considerations) next.considerations = defaultProd.default_considerations;
            return next;
          });
        }
      }
    })();
  }, [proposal]);

  // When SDR changes product manually, refresh template defaults for empty/template-matching fields
  useEffect(() => {
    if (proposal) return; // never auto-fill on edit
    if (!form.product_id || products.length === 0) return;
    const prod = products.find(p => p.id === form.product_id);
    if (!prod) return;

    setForm(f => {
      const next = { ...f };
      // Title: fill if empty OR if it still matches some product's previous template
      const titleEmpty = !f.title.trim();
      const titleMatchesAnyTemplate = products.some(p => {
        if (!p.default_title_template) return false;
        const rendered = p.default_title_template.replace(/\{\{empresa\}\}/g, f.company_name || "");
        return rendered === f.title;
      });
      if ((titleEmpty || titleMatchesAnyTemplate) && prod.default_title_template) {
        next.title = prod.default_title_template.replace(/\{\{empresa\}\}/g, f.company_name || "");
      }
      // Scope/considerations: fill only if empty OR matches any product default
      const scopeMatches = products.some(p => p.default_scope && p.default_scope === f.scope);
      if ((!stripHtml(f.scope) || scopeMatches) && prod.default_scope) next.scope = prod.default_scope;
      const consMatches = products.some(p => p.default_considerations && p.default_considerations === f.considerations);
      if ((!stripHtml(f.considerations) || consMatches) && prod.default_considerations) next.considerations = prod.default_considerations;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.product_id]);

  // When company_name changes, recompute title if it still matches the current product's template
  useEffect(() => {
    if (proposal) return;
    if (!form.product_id) return;
    const prod = products.find(p => p.id === form.product_id);
    if (!prod?.default_title_template) return;

    setForm(f => {
      // Detect if current title was generated from this template (with any company name)
      const tmpl = prod.default_title_template!;
      const escaped = tmpl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\{\\\{empresa\\\}\\\}/g, "(.*)");
      const re = new RegExp(`^${escaped}$`);
      if (re.test(f.title) || !f.title.trim()) {
        return { ...f, title: tmpl.replace(/\{\{empresa\}\}/g, f.company_name || "") };
      }
      return f;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.company_name]);

  // When product changes, set master to its active version
  useEffect(() => {
    if (!form.product_id) return;
    const productMasters = masters.filter(m => m.product_id === form.product_id);
    const currentValid = productMasters.some(m => m.id === form.master_asset_id);
    if (!currentValid) {
      const active = productMasters.find(m => m.is_active);
      setForm(f => ({ ...f, master_asset_id: active?.id || "" }));
    }
  }, [form.product_id, masters]);

  const productMasters = useMemo(
    () => masters.filter(m => m.product_id === form.product_id),
    [masters, form.product_id]
  );

  useEffect(() => {
    supabase
      .from("proposals")
      .select("id, title, company_name, scope, considerations, created_at")
      .order("created_at", { ascending: false })
      .limit(15)
      .then(({ data }) => {
        if (data) setRecentProposals(data);
      });
  }, []);

  useEffect(() => {
    const leadId = prefill?.lead_id || proposal?.lead_id;
    if (!leadId) return;
    supabase
      .from("leads")
      .select("briefing_notes")
      .eq("id", leadId)
      .single()
      .then(({ data }) => {
        if (data?.briefing_notes) setBriefingNotes(data.briefing_notes);
      });
  }, [prefill?.lead_id, proposal?.lead_id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requiresManualOrigin) {
      if (!manualOrigin.email.trim()) { toast.error("Informe o e-mail do contato."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(manualOrigin.email.trim())) { toast.error("E-mail inválido."); return; }
      if (!manualOrigin.origem) { toast.error("Selecione a origem da oportunidade."); return; }
    }
    const data: any = { ...form };
    if (prefill?.lead_id && !proposal) {
      data.lead_id = prefill.lead_id;
    }
    if (requiresManualOrigin) {
      data.manual_origin = {
        email: manualOrigin.email.trim(),
        telefone: manualOrigin.telefone.trim(),
        origem: manualOrigin.origem,
        origem_detalhe: manualOrigin.origem_detalhe.trim(),
      };
    }
    onSave(data);
  };

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      {briefingNotes && (
        <Collapsible open={briefingOpen} onOpenChange={setBriefingOpen} className="mb-6">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 w-full text-left text-sm font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
            >
              <FileText className="h-4 w-4" />
              Briefing do Lead
              <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${briefingOpen ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div
              className="mt-3 p-4 bg-muted border border-border rounded-lg text-sm text-foreground prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: briefingNotes }}
            />
          </CollapsibleContent>
        </Collapsible>
      )}

      <h2 className="text-xl font-bold text-foreground mb-6">
        {proposal ? "Editar Proposta" : "Nova Proposta"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {requiresManualOrigin && (
          <div className="p-4 rounded-lg border space-y-4" style={{ borderColor: 'hsl(var(--color-brand) / 0.3)', background: 'hsl(var(--color-brand) / 0.04)' }}>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: 'hsl(var(--color-brand))' }} />
              <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'hsl(var(--color-brand))' }}>
                Origem da oportunidade
              </h3>
            </div>
            <p className="text-xs text-muted-foreground -mt-1">
              Como este lead não veio de um formulário, precisamos dos dados reais do contato para criar o registro no CRM.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>E-mail do contato *</Label>
                <Input
                  type="email"
                  value={manualOrigin.email}
                  onChange={(e) => setManualOrigin((m) => ({ ...m, email: e.target.value }))}
                  placeholder="contato@empresa.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={manualOrigin.telefone}
                  onChange={(e) => setManualOrigin((m) => ({ ...m, telefone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label>Origem *</Label>
                <Select value={manualOrigin.origem} onValueChange={(v) => setManualOrigin((m) => ({ ...m, origem: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione a origem" /></SelectTrigger>
                  <SelectContent>
                    {sources.map((s) => (
                      <SelectItem key={s.slug} value={s.slug}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Detalhe da origem</Label>
                <Input
                  value={manualOrigin.origem_detalhe}
                  onChange={(e) => setManualOrigin((m) => ({ ...m, origem_detalhe: e.target.value }))}
                  placeholder="Ex.: Indicação Flávio Ribeiro"
                />
              </div>
            </div>
          </div>
        )}
        {products.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4 p-4 rounded-lg border" style={{ borderColor: 'hsl(var(--color-border))', background: 'hsl(var(--color-bg-subtle))' }}>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5" /> Produto *</Label>
              <Select value={form.product_id} onValueChange={(v) => set("product_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>PDF Mestre</Label>
              <Select
                value={form.master_asset_id || "__none__"}
                onValueChange={(v) => set("master_asset_id", v === "__none__" ? "" : v)}
                disabled={!form.product_id || productMasters.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={productMasters.length === 0 ? "Nenhum mestre cadastrado" : "Versão"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem mestre (modo legado)</SelectItem>
                  {productMasters.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.version}{m.label ? ` — ${m.label}` : ""}{m.is_active ? " (ativo)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
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
            <Label>Data da Proposta</Label>
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

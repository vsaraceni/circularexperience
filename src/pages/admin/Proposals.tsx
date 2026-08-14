import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import ProposalForm from "@/components/admin/ProposalForm";
import ProposalList from "@/components/admin/ProposalList";
import ProposalFilters, { type FilterOption } from "@/components/admin/ProposalFilters";
import CrmNavbar from "@/components/admin/CrmNavbar";
import { createManualLeadForProposal } from "@/lib/manualLead";
import { PAGE_SIZE, resolveRange, useProposalFilters } from "@/hooks/useProposalFilters";

export interface Proposal {
  id: string;
  company_name: string;
  contact_name: string;
  contact_role: string;
  event_date: string | null;
  title: string;
  scope: string;
  investment: string;
  considerations: string;
  valid_until: string | null;
  slug: string;
  created_at: string;
  created_by: string;
  author_name: string;
  author_phone: string;
  author_email: string;
  status?: string;
  lead_id?: string;
  product_id?: string | null;
  master_asset_id?: string | null;
}

interface AuthorDefaults {
  author_name: string;
  author_email: string;
  author_phone: string;
}

const STATUS_TABS = [
  { value: "rascunho", label: "Rascunhos" },
  { value: "enviada", label: "Enviadas" },
  { value: "fechada", label: "Fechadas" },
  { value: "perdida", label: "Perdidas" },
];

const sel = (s: string): string => s;

const Proposals = () => {
  const { user } = useAuth();
  const { filters, setFilters, clearAll, activeCount } = useProposalFilters();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<Proposal | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [prefill, setPrefill] = useState<{ company_name?: string; contact_name?: string; contact_role?: string; lead_id?: string } | undefined>();
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [search, setSearch] = useState(filters.q);
  const [authorDefaults, setAuthorDefaults] = useState<AuthorDefaults>({ author_name: "", author_email: "", author_phone: "" });

  const [sentMap, setSentMap] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Record<string, { name: string; color: string | null }>>({});
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [empresas, setEmpresas] = useState<FilterOption[]>([]);

  const searchRef = useRef(filters.q);

  // Debounce da busca -> URL
  useEffect(() => {
    if (search === searchRef.current) return;
    const t = setTimeout(() => {
      searchRef.current = search;
      setFilters({ q: search });
    }, 300);
    return () => clearTimeout(t);
  }, [search, setFilters]);

  // Sincroniza quando a URL muda por fora (ex.: limpar tudo)
  useEffect(() => {
    if (filters.q !== searchRef.current) {
      searchRef.current = filters.q;
      setSearch(filters.q);
    }
  }, [filters.q]);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, cargo, phone")
      .eq("id", user.id)
      .single();
    if (data) {
      setAuthorDefaults({
        author_name: data.full_name || "",
        author_email: data.email || "",
        author_phone: (data as any).phone || "",
      });
    }
  }, [user]);

  const fetchReferences = useCallback(async () => {
    const [subs, prods, profs, comps] = await Promise.all([
      supabase.from("proposal_submissions").select(sel("proposal_id, sent_at")).order("sent_at", { ascending: true }),
      supabase.from("products").select(sel("id, name, brand_color")).order("sort_order"),
      supabase.from("profiles").select(sel("id, full_name")).order("full_name"),
      supabase.from("proposals").select(sel("company_name")).order("company_name"),
    ]);

    const sm: Record<string, string> = {};
    ((subs.data as any[]) || []).forEach((s) => {
      if (s.proposal_id && s.sent_at) sm[s.proposal_id] = s.sent_at; // ordenado asc => fica o mais recente
    });
    setSentMap(sm);

    const pm: Record<string, { name: string; color: string | null }> = {};
    ((prods.data as any[]) || []).forEach((p) => { pm[p.id] = { name: p.name, color: p.brand_color }; });
    setProducts(pm);

    const fm: Record<string, string> = {};
    ((profs.data as any[]) || []).forEach((p) => { if (p.full_name) fm[p.id] = p.full_name; });
    setProfiles(fm);

    const uniques = Array.from(
      new Set(((comps.data as any[]) || []).map((c) => c.company_name).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
    setEmpresas(uniques.map((c) => ({ value: c, label: c })));
  }, []);

  const applyFilters = useCallback(
    (query: any, sentIds: string[] | null) => {
      let q = query;
      const termo = filters.q.trim().replace(/[,%]/g, " ");
      if (termo) {
        q = q.or(`title.ilike.%${termo}%,company_name.ilike.%${termo}%,contact_name.ilike.%${termo}%`);
      }
      if (filters.empresa) q = q.eq("company_name", filters.empresa);
      if (filters.produto === "none") q = q.is("product_id", null);
      else if (filters.produto) q = q.eq("product_id", filters.produto);
      if (filters.autor) q = q.eq("created_by", filters.autor);

      const range = resolveRange(filters);
      if (filters.dateField === "criacao") {
        if (range.from) q = q.gte("created_at", `${range.from}T00:00:00`);
        if (range.to) q = q.lte("created_at", `${range.to}T23:59:59`);
      } else if (sentIds) {
        q = q.in("id", sentIds.length ? sentIds : ["00000000-0000-0000-0000-000000000000"]);
      }
      return q;
    },
    [filters],
  );

  const sentFilterIds = useMemo(() => {
    if (filters.dateField !== "envio" || filters.period === "todos") return null;
    const range = resolveRange(filters);
    return Object.entries(sentMap)
      .filter(([, sentAt]) => {
        const d = sentAt.slice(0, 10);
        if (range.from && d < range.from) return false;
        if (range.to && d > range.to) return false;
        return true;
      })
      .map(([id]) => id);
  }, [filters, sentMap]);

  const fetchPage = useCallback(async () => {
    setListLoading(true);

    if (filters.sort === "envio") {
      // Ordenação por data de envio: resolve os ids no cliente (base pequena)
      const idQuery = applyFilters(
        supabase.from("proposals").select(sel("id")).eq("status", filters.status),
        sentFilterIds,
      );
      const { data: idRows, error } = await idQuery;
      if (error) { toast.error("Erro ao carregar propostas"); setListLoading(false); return; }
      const ids = ((idRows as any[]) || []).map((r) => r.id as string);
      ids.sort((a, b) => (sentMap[b] || "").localeCompare(sentMap[a] || ""));
      setTotal(ids.length);
      const pageIds = ids.slice((filters.page - 1) * PAGE_SIZE, filters.page * PAGE_SIZE);
      if (pageIds.length === 0) { setProposals([]); setListLoading(false); return; }
      const { data } = await supabase.from("proposals").select(sel("*")).in("id", pageIds);
      const byId = new Map(((data as any[]) || []).map((p) => [p.id, p]));
      setProposals(pageIds.map((id) => byId.get(id)).filter(Boolean) as Proposal[]);
      setListLoading(false);
      return;
    }

    let query = applyFilters(
      supabase.from("proposals").select(sel("*"), { count: "exact" }).eq("status", filters.status),
      sentFilterIds,
    );

    if (filters.sort === "empresa") query = query.order("company_name", { ascending: true });
    else if (filters.sort === "validade") query = query.order("valid_until", { ascending: true, nullsFirst: false });
    else query = query.order("created_at", { ascending: false });

    const from = (filters.page - 1) * PAGE_SIZE;
    const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) toast.error("Erro ao carregar propostas");
    else {
      setProposals(((data as any[]) || []) as Proposal[]);
      setTotal(count ?? 0);
    }
    setListLoading(false);
  }, [applyFilters, filters.page, filters.sort, filters.status, sentFilterIds, sentMap]);

  const fetchCounts = useCallback(async () => {
    const results = await Promise.all(
      STATUS_TABS.map((t) =>
        applyFilters(
          supabase.from("proposals").select(sel("id"), { count: "exact", head: true }).eq("status", t.value),
          sentFilterIds,
        ),
      ),
    );
    const next: Record<string, number> = {};
    STATUS_TABS.forEach((t, i) => { next[t.value] = (results[i] as any).count ?? 0; });
    setCounts(next);
  }, [applyFilters, sentFilterIds]);

  useEffect(() => {
    Promise.all([fetchReferences(), fetchProfile()]).then(() => setLoading(false));
  }, [fetchReferences, fetchProfile]);

  useEffect(() => { void fetchPage(); }, [fetchPage]);
  useEffect(() => { void fetchCounts(); }, [fetchCounts]);

  const refresh = async () => {
    await Promise.all([fetchPage(), fetchCounts(), fetchReferences()]);
  };

  const handleSave = async (data: Partial<Proposal> & { lead_id?: string }) => {
    const leadId = data.lead_id;
    const manualOrigin = (data as any).manual_origin as
      | { email: string; telefone: string; origem: string; origem_detalhe: string }
      | undefined;
    const saveData = { ...data };
    delete (saveData as any).lead_id;
    delete (saveData as any).manual_origin;

    if (editing) {
      const { error } = await supabase.from("proposals").update(saveData).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar proposta"); return; }
      toast.success("Proposta atualizada!");
    } else {
      const slug = `prop-${crypto.randomUUID().slice(0, 8)}`;
      const insertData: any = { ...saveData, slug, created_by: user!.id };

      let finalLeadId = leadId;

      if (!finalLeadId) {
        if (!manualOrigin) { toast.error("Origem da oportunidade é obrigatória."); return; }
        const created = await createManualLeadForProposal({
          origin: manualOrigin,
          contact_name: saveData.contact_name || "",
          contact_role: saveData.contact_role || "",
          company_name: saveData.company_name || "",
        });
        if ("error" in created) { toast.error("Erro ao criar lead: " + created.error); return; }
        finalLeadId = created.id;
      }

      if (finalLeadId) {
        insertData.lead_id = finalLeadId;
        // Vincula a proposta à organização/contato já resolvidos no lead
        const { data: leadRow } = await supabase
          .from("leads")
          .select("organization_id, contact_id")
          .eq("id", finalLeadId)
          .maybeSingle();
        if (leadRow?.organization_id) insertData.organization_id = leadRow.organization_id;
        if (leadRow?.contact_id) insertData.contact_id = leadRow.contact_id;
      }

      const { error } = await supabase.from("proposals").insert(insertData);
      if (error) { toast.error("Erro ao criar proposta"); return; }

      if (finalLeadId) {
        const now = new Date().toISOString();
        await supabase.from("leads").update({ status: "converted", kanban_stage: "proposta", stage_updated_at: now, last_activity_at: now }).eq("id", finalLeadId);
        await supabase.from("lead_activities").insert({ lead_id: finalLeadId, user_id: user!.id, activity_type: "proposta_gerada", content: "Proposta gerada" });
      }
      toast.success("Proposta criada!");
    }
    const wasEditing = !!editing;
    setEditing(null);
    setShowForm(false);
    setPrefill(undefined);
    if (!wasEditing) setFilters({ status: "rascunho", page: 1 });
    await refresh();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("proposals").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir proposta");
    else { toast.success("Proposta excluída!"); void refresh(); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase.from("proposals").update({ status }).eq("id", id);
    if (error) toast.error("Erro ao atualizar status");
    else {
      const labels: Record<string, string> = { rascunho: "rascunho", enviada: "enviada", fechada: "fechada", perdida: "perdida" };
      toast.success(`Proposta marcada como ${labels[status] || status}`);
      void refresh();
    }
  };

  const meta = useMemo(() => {
    const m: Record<string, { productName?: string | null; productColor?: string | null; sentAt?: string | null; authorName?: string | null }> = {};
    proposals.forEach((p) => {
      const prod = p.product_id ? products[p.product_id] : undefined;
      m[p.id] = {
        productName: prod?.name ?? null,
        productColor: prod?.color ?? null,
        sentAt: sentMap[p.id] ?? null,
        authorName: profiles[p.created_by] ?? p.author_name ?? null,
      };
    });
    return m;
  }, [proposals, products, profiles, sentMap]);

  const produtoOptions: FilterOption[] = useMemo(
    () => [
      ...Object.entries(products).map(([id, p]) => ({ value: id, label: p.name })),
      { value: "none", label: "Sem produto" },
    ],
    [products],
  );

  const autorOptions: FilterOption[] = useMemo(
    () => Object.entries(profiles).map(([id, name]) => ({ value: id, label: name })),
    [profiles],
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstItem = total === 0 ? 0 : (filters.page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(filters.page * PAGE_SIZE, total);

  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ background: 'hsl(var(--color-bg-page))' }}>
      <CrmNavbar currentModule="propostas" />

      {showForm || editing ? (
        <main className="flex-1 overflow-auto container px-4 max-w-5xl py-6">
          <ProposalForm
            proposal={editing}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null); setPrefill(undefined); }}
            prefill={prefill}
            authorDefaults={!editing ? authorDefaults : undefined}
          />
        </main>
      ) : loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'hsl(var(--color-brand))' }} />
        </div>
      ) : (
        <main className="flex-1 overflow-auto container px-4 max-w-5xl py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold" style={{ color: 'hsl(var(--color-text-primary))' }}>Propostas</h1>
            <Button
              size="sm"
              className="h-9 px-4 rounded-lg font-medium"
              style={{ background: 'hsl(var(--color-brand))', color: 'white' }}
              onClick={() => { setPrefill(undefined); setShowForm(true); }}
            >
              <Plus className="h-4 w-4 mr-1.5" /> Nova Proposta
            </Button>
          </div>

          <ProposalFilters
            filters={filters}
            setFilters={setFilters}
            clearAll={clearAll}
            activeCount={activeCount}
            search={search}
            onSearchChange={setSearch}
            empresas={empresas}
            produtos={produtoOptions}
            autores={autorOptions}
          />

          <Tabs value={filters.status} onValueChange={(v) => setFilters({ status: v })}>
            <TabsList className="w-full grid grid-cols-4">
              {STATUS_TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label} {counts[t.value] ? `(${counts[t.value]})` : ""}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex items-center justify-between text-xs text-muted-foreground mt-4 mb-2">
            <span>
              {total === 0 ? "Nenhuma proposta encontrada" : `Mostrando ${firstItem}–${lastItem} de ${total}`}
            </span>
          </div>

          {listLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[92px] w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <ProposalList
              proposals={proposals}
              onEdit={(p) => setEditing(p)}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              statusFilter={filters.status}
              meta={meta}
            />
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                disabled={filters.page <= 1}
                onClick={() => setFilters({ page: filters.page - 1 })}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Página {filters.page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                disabled={filters.page >= totalPages}
                onClick={() => setFilters({ page: filters.page + 1 })}
              >
                Próxima <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </main>
      )}
    </div>
  );
};

export default Proposals;

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import CrmNavbar from "@/components/admin/CrmNavbar";
import OrganizationDrawer, { OrganizationRow } from "@/components/admin/OrganizationDrawer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Building2, Users, Loader2 } from "lucide-react";

const ORG_FIELDS =
  "id, name, website, domain, setor, segmento, porte, faixa_funcionarios, tier, descricao, cidade, uf, status_relacionamento, is_multinational, enriched_at, ultima_interacao_em";

const Base = () => {
  const [tab, setTab] = useState("organizacoes");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<OrganizationRow | null>(null);

  const { data: orgs = [], isLoading: loadingOrgs } = useQuery({
    queryKey: ["base_orgs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select(ORG_FIELDS)
        .order("name");
      if (error) throw error;
      return (data || []) as OrganizationRow[];
    },
  });

  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ["base_contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, nome, cargo, email, telefone, decisor, organization_id, organizations(name)")
        .order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  const termo = q.trim().toLowerCase();

  const filteredOrgs = useMemo(
    () =>
      orgs.filter((o) =>
        !termo ? true : [o.name, o.website, o.setor, o.segmento, o.cidade].filter(Boolean).join(" ").toLowerCase().includes(termo),
      ),
    [orgs, termo],
  );

  const filteredContacts = useMemo(
    () =>
      (contacts as any[]).filter((c) =>
        !termo
          ? true
          : [c.nome, c.email, c.cargo, c.organizations?.name].filter(Boolean).join(" ").toLowerCase().includes(termo),
      ),
    [contacts, termo],
  );

  const openOrgById = (id?: string | null) => {
    if (!id) return;
    const org = orgs.find((o) => o.id === id);
    if (org) setSelected(org);
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ background: "hsl(var(--color-bg-page))" }}>
      <CrmNavbar currentModule="base" />

      <main className="flex-1 overflow-auto container px-4 max-w-6xl py-6">
        <header className="mb-4">
          <h1 className="text-xl font-semibold" style={{ color: "hsl(var(--color-text-primary))" }}>Base</h1>
          <p className="text-sm text-muted-foreground">Organizações e contatos consolidados do CRM.</p>
        </header>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por empresa, contato, e-mail, setor…"
            className="pl-9"
            aria-label="Buscar na base"
          />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="organizacoes" className="gap-2">
              <Building2 className="h-4 w-4" /> Organizações ({filteredOrgs.length})
            </TabsTrigger>
            <TabsTrigger value="contatos" className="gap-2">
              <Users className="h-4 w-4" /> Contatos ({filteredContacts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organizacoes" className="mt-4">
            {loadingOrgs ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : filteredOrgs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma organização encontrada.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {filteredOrgs.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setSelected(o)}
                    className="text-left bg-white border rounded-xl p-3 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ borderColor: "hsl(var(--color-border))" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold truncate">{o.name}</p>
                      {o.tier && <Badge variant="secondary" className="text-[10px] shrink-0">T{o.tier}</Badge>}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {[o.setor || o.segmento, o.faixa_funcionarios, [o.cidade, o.uf].filter(Boolean).join("/")]
                        .filter(Boolean)
                        .join(" · ") || "Sem dados adicionais"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contatos" className="mt-4">
            {loadingContacts ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : filteredContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhum contato encontrado.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {filteredContacts.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => openOrgById(c.organization_id)}
                    className="text-left bg-white border rounded-xl p-3 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ borderColor: "hsl(var(--color-border))" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold truncate">{c.nome}</p>
                      {c.decisor && <Badge variant="secondary" className="text-[10px] shrink-0">decisor</Badge>}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {[c.cargo, c.organizations?.name].filter(Boolean).join(" · ") || "—"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{c.email || c.telefone || ""}</p>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <OrganizationDrawer org={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
};

export default Base;

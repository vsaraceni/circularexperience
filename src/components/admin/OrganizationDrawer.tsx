import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Globe, Users, FileText, Mail, Phone, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface OrganizationRow {
  id: string;
  name: string;
  website: string | null;
  domain: string | null;
  setor: string | null;
  segmento: string | null;
  porte: string | null;
  faixa_funcionarios: string | null;
  tier: number | null;
  descricao: string | null;
  cidade: string | null;
  uf: string | null;
  status_relacionamento: string;
  is_multinational: boolean;
  enriched_at: string | null;
  ultima_interacao_em: string | null;
}

const fmt = (d?: string | null) => (d ? format(new Date(d), "dd/MM/yyyy", { locale: ptBR }) : "—");

const Row = ({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) => (
  <div className="flex items-start gap-2 py-1.5">
    <span className="text-muted-foreground mt-0.5">{icon}</span>
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline break-all">{value}</a>
      ) : (
        <p className="text-sm text-foreground break-words">{value}</p>
      )}
    </div>
  </div>
);

interface Props {
  org: OrganizationRow | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const OrganizationDrawer: React.FC<Props> = ({ org, open, onOpenChange }) => {
  const navigate = useNavigate();

  const { data: contacts = [] } = useQuery({
    queryKey: ["org_contacts", org?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("contacts")
        .select("id, nome, cargo, email, telefone, decisor")
        .eq("organization_id", org!.id)
        .order("nome");
      return data || [];
    },
    enabled: !!org?.id && open,
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["org_proposals", org?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("proposals")
        .select("id, title, slug, status, investment, created_at, contact_name")
        .eq("organization_id", org!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!org?.id && open,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["org_leads", org?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, name, kanban_stage, origem, created_at")
        .eq("organization_id", org!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!org?.id && open,
  });

  if (!org) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" style={{ color: "hsl(var(--color-brand))" }} />
            {org.name}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {org.tier && <Badge variant="secondary" className="text-[10px]">Tier {org.tier}</Badge>}
          {org.porte && <Badge variant="secondary" className="text-[10px]">{org.porte}</Badge>}
          {org.is_multinational && <Badge variant="secondary" className="text-[10px]">Multinacional</Badge>}
          <Badge variant="outline" className="text-[10px]">{org.status_relacionamento}</Badge>
          {org.enriched_at && <Badge variant="secondary" className="text-[10px]">enriquecida</Badge>}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-4">
          {org.website && <Row icon={<Globe className="h-4 w-4" />} label="Site" value={org.website.replace(/^https?:\/\//, "")} href={org.website} />}
          <Row icon={<Users className="h-4 w-4" />} label="Colaboradores" value={org.faixa_funcionarios || "—"} />
          <Row icon={<Building2 className="h-4 w-4" />} label="Setor" value={org.setor || org.segmento || "—"} />
          <Row icon={<Building2 className="h-4 w-4" />} label="Local" value={[org.cidade, org.uf].filter(Boolean).join("/") || "—"} />
        </div>

        {org.descricao && (
          <div className="bg-muted/50 rounded-lg p-3 mt-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Sobre a empresa</p>
            <p className="text-sm text-foreground">{org.descricao}</p>
          </div>
        )}

        <section className="mt-5">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" /> Propostas ({proposals.length})
          </h3>
          {proposals.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Nenhuma proposta para esta organização.</p>
          ) : (
            <div className="space-y-1.5">
              {proposals.map((p: any) => (
                <div key={p.id} className="border rounded-lg p-2.5 flex items-start justify-between gap-2" style={{ borderColor: "hsl(var(--color-border))" }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.contact_name} · {fmt(p.created_at)} · {p.investment || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(`/apresentacao-print/${p.slug}`, "_blank")}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" /> Contatos ({contacts.length})
          </h3>
          {contacts.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Nenhum contato cadastrado.</p>
          ) : (
            <div className="space-y-1.5">
              {contacts.map((c: any) => (
                <div key={c.id} className="border rounded-lg p-2.5" style={{ borderColor: "hsl(var(--color-border))" }}>
                  <p className="text-sm font-medium">
                    {c.nome} {c.decisor && <Badge variant="secondary" className="text-[10px] ml-1">decisor</Badge>}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{c.cargo || "—"}</p>
                  <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-muted-foreground">
                    {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                    {c.telefone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.telefone}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-5 mb-6">
          <h3 className="text-sm font-semibold mb-2">Leads ({leads.length})</h3>
          {leads.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Nenhum lead vinculado.</p>
          ) : (
            <div className="space-y-1.5">
              {leads.map((l: any) => (
                <button
                  key={l.id}
                  onClick={() => navigate(`/admin/pipeline?lead=${l.id}`)}
                  className="w-full text-left border rounded-lg p-2.5 hover:bg-muted/50 transition-colors"
                  style={{ borderColor: "hsl(var(--color-border))" }}
                >
                  <p className="text-sm font-medium">{l.name}</p>
                  <p className="text-[11px] text-muted-foreground">{l.kanban_stage} · {l.origem} · {fmt(l.created_at)}</p>
                </button>
              ))}
            </div>
          )}
        </section>
      </SheetContent>
    </Sheet>
  );
};

export default OrganizationDrawer;

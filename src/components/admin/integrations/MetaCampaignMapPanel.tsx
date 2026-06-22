import { useCallback, useEffect, useState } from "react";
import { Megaphone, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { LeadSourceRow } from "@/hooks/useLeadSources";

interface MapRow {
  campaign_id: string;
  lead_source_id: string;
  product_id: string | null;
  label: string | null;
}

interface Props {
  sources: LeadSourceRow[];
}

export default function MetaCampaignMapPanel({ sources }: Props) {
  const [rows, setRows] = useState<MapRow[]>([]);
  const [unmapped, setUnmapped] = useState<Array<{ campaign_id: string; count: number }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MapRow | null>(null);
  const [campaignId, setCampaignId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [productId, setProductId] = useState("");
  const [label, setLabel] = useState("");

  const refresh = useCallback(async () => {
    const [{ data: maps }, { data: leads }, { data: prods }] = await Promise.all([
      supabase.from("meta_campaign_product_map").select("campaign_id, lead_source_id, product_id, label").order("campaign_id"),
      supabase.from("leads").select("campaign_id").eq("origem", "meta_ads").not("campaign_id", "is", null).limit(500),
      supabase.from("products").select("id, name").eq("is_active", true).order("sort_order"),
    ]);
    setRows((maps ?? []) as MapRow[]);
    setProducts((prods ?? []) as Array<{ id: string; name: string }>);
    const mapped = new Set((maps ?? []).map((m: any) => m.campaign_id));
    const counter: Record<string, number> = {};
    for (const l of (leads ?? []) as Array<{ campaign_id: string }>) {
      if (!l.campaign_id || mapped.has(l.campaign_id)) continue;
      counter[l.campaign_id] = (counter[l.campaign_id] ?? 0) + 1;
    }
    setUnmapped(Object.entries(counter).map(([campaign_id, count]) => ({ campaign_id, count })).sort((a, b) => b.count - a.count));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const openNew = (cid?: string) => {
    setEditing(null);
    setCampaignId(cid ?? "");
    setSourceId("");
    setProductId("");
    setLabel("");
    setOpen(true);
  };

  const openEdit = (row: MapRow) => {
    setEditing(row);
    setCampaignId(row.campaign_id);
    setSourceId(row.lead_source_id);
    setProductId(row.product_id ?? "");
    setLabel(row.label ?? "");
    setOpen(true);
  };

  const save = async () => {
    if (!campaignId.trim() || !sourceId) {
      toast.error("Informe o campaign_id e a fonte");
      return;
    }
    const payload = {
      campaign_id: campaignId.trim(),
      lead_source_id: sourceId,
      product_id: productId || null,
      label: label.trim() || null,
    };
    const { error } = await supabase.from("meta_campaign_product_map").upsert(payload, { onConflict: "campaign_id" });
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Mapeamento atualizado" : "Mapeamento criado");
    setOpen(false);
    refresh();
  };

  const remove = async (cid: string) => {
    if (!confirm("Remover este mapeamento?")) return;
    const { error } = await supabase.from("meta_campaign_product_map").delete().eq("campaign_id", cid);
    if (error) { toast.error(error.message); return; }
    toast.success("Mapeamento removido");
    refresh();
  };

  const metaSources = sources.filter((s) => s.slug.startsWith("meta_ads") || s.slug.includes("meta"));
  const sourceOptions = metaSources.length > 0 ? metaSources : sources;

  return (
    <div className="border rounded-lg p-4 bg-card space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Megaphone className="h-4 w-4" /> Campanhas Meta Ads → Produto
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cada campaign_id do Meta vira uma fonte específica no CRM, com produto e mensagem inicial próprios.
          </p>
        </div>
        <Button size="sm" onClick={() => openNew()}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Mapear campanha
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">Nenhum mapeamento ainda. Leads do Meta caem na fonte genérica <code>meta_ads</code>.</p>
      ) : (
        <div className="space-y-1.5">
          {rows.map((r) => {
            const src = sources.find((s) => s.id === r.lead_source_id);
            const prod = products.find((p) => p.id === r.product_id);
            return (
              <div key={r.campaign_id} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs">{r.campaign_id}</code>
                    {r.label && <span className="text-xs text-muted-foreground">— {r.label}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Fonte: <Badge variant="outline" className="font-mono text-[10px]">{src?.slug ?? "?"}</Badge>
                    {prod && <> · Produto: <span className="font-medium text-foreground">{prod.name}</span></>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(r.campaign_id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {unmapped.length > 0 && (
        <div className="border-t pt-3 mt-3">
          <div className="flex items-center gap-2 text-xs text-amber-700 mb-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            Campanhas vistas em leads e ainda não mapeadas:
          </div>
          <div className="space-y-1">
            {unmapped.slice(0, 10).map((u) => (
              <div key={u.campaign_id} className="flex items-center justify-between text-xs border rounded-md px-3 py-1.5">
                <div>
                  <code>{u.campaign_id}</code>
                  <span className="text-muted-foreground ml-2">{u.count} lead(s)</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => openNew(u.campaign_id)}>Mapear</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar mapeamento" : "Mapear campanha Meta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Campaign ID *</Label>
              <Input value={campaignId} onChange={(e) => setCampaignId(e.target.value)} disabled={!!editing} placeholder="120240490647520301" />
              <p className="text-[11px] text-muted-foreground">Pegue no Gerenciador de Anúncios → Coluna "ID da campanha".</p>
            </div>
            <div className="space-y-1.5">
              <Label>Fonte (lead_source) *</Label>
              <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">— Selecione —</option>
                {sourceOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome} ({s.slug})</option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">Crie uma fonte por produto (ex: <code>meta_ads_circular_experience</code>) com sua mensagem inicial e agente do GPT Maker.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Produto (opcional, sobrescreve o da fonte)</Label>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">— Usar o produto da fonte —</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Etiqueta interna</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Conexão Circular - Jun/26" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
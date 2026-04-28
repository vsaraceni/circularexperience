import { useState } from "react";
import CrmNavbar from "@/components/admin/CrmNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Plug, BookOpen, RotateCw, Pencil, Power, Clock, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLeadSources, type LeadSourceRow } from "@/hooks/useLeadSources";
import IntegrationFormDialog, { type IntegrationFormValues } from "@/components/admin/integrations/IntegrationFormDialog";
import IntegrationKeyDialog from "@/components/admin/integrations/IntegrationKeyDialog";
import IntegrationGuideDialog from "@/components/admin/integrations/IntegrationGuideDialog";
import RotateKeyDialog from "@/components/admin/integrations/RotateKeyDialog";
import WhatsAppPanel from "@/components/admin/integrations/WhatsAppPanel";

function formatRelative(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export default function Integrations() {
  const { sources, metrics, loading, refresh } = useLeadSources();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LeadSourceRow | null>(null);
  const [keyDialog, setKeyDialog] = useState<{ open: boolean; key: string; isRotation: boolean; graceUntil?: string }>({
    open: false, key: "", isRotation: false,
  });
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideSource, setGuideSource] = useState<LeadSourceRow | null>(null);
  const [rotateOpen, setRotateOpen] = useState(false);
  const [rotateTarget, setRotateTarget] = useState<LeadSourceRow | null>(null);

  const callManage = async (action: string, body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke(`manage-lead-source/${action}`, { body });
    if (error) {
      toast.error(`Erro: ${error.message}`);
      throw error;
    }
    if (data?.error) {
      toast.error(data.error);
      throw new Error(data.error);
    }
    return data;
  };

  const handleSubmit = async (values: IntegrationFormValues) => {
    if (editing) {
      await callManage("update", { id: editing.id, ...(values as unknown as Record<string, unknown>) });
      toast.success("Integração atualizada");
      setFormOpen(false);
      refresh();
    } else {
      const data = await callManage("create", values as unknown as Record<string, unknown>);
      toast.success("Integração criada");
      setFormOpen(false);
      refresh();
      setKeyDialog({ open: true, key: data.api_key, isRotation: false });
    }
  };

  const handleRotate = async () => {
    if (!rotateTarget) return;
    const data = await callManage("rotate", { id: rotateTarget.id });
    toast.success("Chave rotacionada");
    setRotateOpen(false);
    refresh();
    setKeyDialog({
      open: true, key: data.api_key, isRotation: true, graceUntil: data.previous_expires_at,
    });
  };

  const toggleActive = async (s: LeadSourceRow) => {
    await callManage("update", { id: s.id, ativo: !s.ativo });
    toast.success(s.ativo ? "Desativada" : "Ativada");
    refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      <CrmNavbar currentModule="pipeline" />

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Plug className="h-6 w-6" /> Integrações
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie canais que enviam leads para o CRM (LPs, formulários externos, parceiros).
            </p>
          </div>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Nova integração
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : (
          <div className="space-y-3">
            <WhatsAppPanel />
            {sources.length === 0 && (
              <div className="border rounded-lg p-12 text-center">
                <Plug className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhuma integração cadastrada ainda.</p>
                <Button className="mt-4" onClick={() => { setEditing(null); setFormOpen(true); }}>
                  <Plus className="h-4 w-4 mr-1.5" /> Criar primeira
                </Button>
              </div>
            )}
            {sources.map((s) => {
              const m = metrics[s.slug];
              const grace = s.previous_api_key_expires_at && new Date(s.previous_api_key_expires_at) > new Date();
              return (
                <div key={s.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{s.nome}</h3>
                        <Badge variant="outline" className="font-mono text-xs">{s.slug}</Badge>
                        {s.ativo ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                        {grace && (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1">
                            <Clock className="h-3 w-3" /> Chave anterior em graça
                          </Badge>
                        )}
                        {s.whatsapp_auto_send && (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 gap-1">
                            <MessageCircle className="h-3 w-3" /> WhatsApp auto
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <div><span className="font-medium">Chave:</span> <span className="font-mono">{s.api_key_prefix}...</span></div>
                        <div><span className="font-medium">Rate:</span> {s.rate_limit_per_min}/min</div>
                        <div><span className="font-medium">Leads (7d):</span> {m?.total_7d ?? 0}{m && m.errors_7d > 0 ? ` (${m.errors_7d} erros)` : ""}</div>
                        <div><span className="font-medium">Última:</span> {formatRelative(m?.last_at ?? null)}</div>
                      </div>
                      {s.cors_origins.length > 0 && (
                        <div className="mt-1.5 text-xs text-muted-foreground">
                          <span className="font-medium">CORS:</span> {s.cors_origins.join(", ")}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => { setGuideSource(s); setGuideOpen(true); }}>
                        <BookOpen className="h-3.5 w-3.5 mr-1" /> Como integrar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditing(s); setFormOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setRotateTarget(s); setRotateOpen(true); }}>
                        <RotateCw className="h-3.5 w-3.5 mr-1" /> Rotacionar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toggleActive(s)}>
                        <Power className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <IntegrationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        source={editing}
        onSubmit={handleSubmit}
      />
      <IntegrationKeyDialog
        open={keyDialog.open}
        onOpenChange={(v) => setKeyDialog({ ...keyDialog, open: v })}
        apiKey={keyDialog.key}
        isRotation={keyDialog.isRotation}
        graceUntil={keyDialog.graceUntil}
      />
      <IntegrationGuideDialog open={guideOpen} onOpenChange={setGuideOpen} source={guideSource} />
      <RotateKeyDialog
        open={rotateOpen}
        onOpenChange={setRotateOpen}
        sourceName={rotateTarget?.nome ?? ""}
        onConfirm={handleRotate}
      />
    </div>
  );
}
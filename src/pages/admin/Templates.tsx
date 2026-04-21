import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAllTemplatesAdmin } from "@/hooks/useMessageTemplates";
import { STAGE_ORDER, STAGE_LABELS, CHANNEL_CONFIG, type MessageTemplate } from "@/components/admin/messageTemplates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { LogoImage } from "@/components/LogoImage";
import logo from "@/assets/movimento-circular-logo.png";

const Templates = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: templates = [], isLoading } = useAllTemplatesAdmin();

  // Active products for the product selector and chips
  const { data: products = [] } = useQuery({
    queryKey: ["products_active_for_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });
  const productMap = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p.name])),
    [products],
  );

  const [productFilter, setProductFilter] = useState<string>("all"); // "all" | "global" | productId

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title?: string; subject?: string | null; body?: string; channel?: string; product_id?: string | null }>({});
  const [addDialog, setAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({ stage: "novo", channel: "whatsapp" as string, title: "", subject: "", body: "", product_id: null as string | null });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    if (productFilter === "all") return templates;
    if (productFilter === "global") return templates.filter((t) => !t.product_id);
    return templates.filter((t) => t.product_id === productFilter);
  }, [templates, productFilter]);

  const grouped = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = filteredTemplates.filter((t) => t.stage === stage).sort((a, b) => a.sort_order - b.sort_order);
    return acc;
  }, {} as Record<string, MessageTemplate[]>);

  const startEdit = (t: MessageTemplate) => {
    setEditingId(t.id);
    setEditForm({ title: t.title, subject: t.subject, body: t.body, channel: t.channel, product_id: t.product_id ?? null });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from("message_templates")
      .update({ title: editForm.title, subject: editForm.subject || null, body: editForm.body, channel: editForm.channel, product_id: editForm.product_id ?? null, updated_at: new Date().toISOString() })
      .eq("id", editingId);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Template atualizado!");
    cancelEdit();
    queryClient.invalidateQueries({ queryKey: ["message_templates_admin"] });
  };

  const handleAdd = async () => {
    const stageTemplates = grouped[addForm.stage] || [];
    const maxOrder = stageTemplates.length > 0 ? Math.max(...stageTemplates.map((t) => t.sort_order)) : 0;
    const { error } = await supabase.from("message_templates").insert({
      stage: addForm.stage,
      channel: addForm.channel,
      title: addForm.title,
      subject: addForm.subject || null,
      body: addForm.body,
      sort_order: maxOrder + 1,
      product_id: addForm.product_id ?? null,
    });
    if (error) { toast.error("Erro ao criar template"); return; }
    toast.success("Template criado!");
    setAddDialog(false);
    setAddForm({ stage: "novo", channel: "whatsapp", title: "", subject: "", body: "", product_id: null });
    queryClient.invalidateQueries({ queryKey: ["message_templates_admin"] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("message_templates").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover"); return; }
    toast.success("Template removido!");
    setDeleteConfirm(null);
    queryClient.invalidateQueries({ queryKey: ["message_templates_admin"] });
  };

  const handleReorder = async (t: MessageTemplate, direction: "up" | "down") => {
    const siblings = grouped[t.stage];
    const idx = siblings.findIndex((s) => s.id === t.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;

    const other = siblings[swapIdx];
    await Promise.all([
      supabase.from("message_templates").update({ sort_order: other.sort_order }).eq("id", t.id),
      supabase.from("message_templates").update({ sort_order: t.sort_order }).eq("id", other.id),
    ]);
    queryClient.invalidateQueries({ queryKey: ["message_templates_admin"] });
  };

  const handleToggleActive = async (t: MessageTemplate) => {
    const { error } = await supabase
      .from("message_templates")
      .update({ is_active: !(t.is_active ?? true) })
      .eq("id", t.id);
    if (error) { toast.error("Erro"); return; }
    queryClient.invalidateQueries({ queryKey: ["message_templates_admin"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/propostas")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <LogoImage src={logo} alt="MC" className="h-8" />
          <h1 className="text-lg font-bold text-foreground">Gerenciar Templates de Mensagem</h1>
          <div className="flex-1" />
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="h-8 w-[200px] text-xs"><SelectValue placeholder="Filtrar por produto" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os templates</SelectItem>
              <SelectItem value="global">Apenas globais</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-1" onClick={() => setAddDialog(true)}>
            <Plus className="h-4 w-4" /> Novo Template
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Variables Reference Panel */}
        <Card className="border-dashed">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Variáveis disponíveis</h3>
            <div className="space-y-2">
              <div>
                <p className="text-[11px] text-muted-foreground font-medium mb-1.5">Automáticas (preenchidas pelo sistema)</p>
                <div className="flex flex-wrap gap-1.5">
                  {["{{nome}}", "{{empresa}}", "{{cargo}}", "{{nome_especialista}}", "{{cargo_especialista}}", "{{data_envio_proposta}}"].map((v) => (
                    <Badge
                      key={v}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary/10 text-xs font-mono transition-colors"
                      onClick={() => { navigator.clipboard.writeText(v); toast.success(`"${v}" copiado!`); }}
                    >
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium mb-1.5">Manuais (preenchidas pelo usuário antes de copiar)</p>
                <div className="flex flex-wrap gap-1.5">
                  {["{{dia1}}", "{{dia2}}", "{{horário}}", "{{mês}}", "{{prazo}}"].map((v) => (
                    <Badge
                      key={v}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent text-xs font-mono transition-colors"
                      onClick={() => { navigator.clipboard.writeText(v); toast.success(`"${v}" copiado!`); }}
                    >
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">Clique em qualquer variável para copiá-la.</p>
          </CardContent>
        </Card>

        {isLoading ? (
          <p className="text-muted-foreground text-center py-12">Carregando templates...</p>
        ) : (
          STAGE_ORDER.map((stage) => {
            const stageTemplates = grouped[stage] || [];
            return (
              <section key={stage}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-base font-bold text-foreground">{STAGE_LABELS[stage]}</h2>
                  <Badge variant="secondary" className="text-xs">{stageTemplates.length}</Badge>
                </div>

                {stageTemplates.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic pl-2">Nenhum template neste estágio.</p>
                ) : (
                  <div className="space-y-3">
                    {stageTemplates.map((t, idx) => {
                      const isEditing = editingId === t.id;
                      const channelCfg = CHANNEL_CONFIG[t.channel];

                      return (
                        <Card key={t.id} className={`${!(t.is_active ?? true) ? "opacity-50" : ""}`}>
                          <CardContent className="p-4">
                            {isEditing ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <Input value={editForm.title || ""} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} placeholder="Título" />
                                  <Select value={editForm.channel || "whatsapp"} onValueChange={(v) => setEditForm((f) => ({ ...f, channel: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                      <SelectItem value="email">E-mail</SelectItem>
                                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Select
                                  value={editForm.product_id ?? "__global__"}
                                  onValueChange={(v) => setEditForm((f) => ({ ...f, product_id: v === "__global__" ? null : v }))}
                                >
                                  <SelectTrigger><SelectValue placeholder="Produto vinculado" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__global__">Todos os produtos (global)</SelectItem>
                                    {products.map((p) => (
                                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {editForm.channel === "email" && (
                                  <Input value={editForm.subject || ""} onChange={(e) => setEditForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Assunto" />
                                )}
                                <Textarea value={editForm.body || ""} onChange={(e) => setEditForm((f) => ({ ...f, body: e.target.value }))} className="min-h-[120px] font-mono text-xs" />
                                <div className="flex gap-2">
                                  <Button size="sm" className="gap-1" onClick={saveEdit}><Save className="h-3 w-3" /> Salvar</Button>
                                  <Button variant="ghost" size="sm" className="gap-1" onClick={cancelEdit}><X className="h-3 w-3" /> Cancelar</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex flex-col gap-0.5">
                                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" disabled={idx === 0} onClick={() => handleReorder(t, "up")}>
                                      <ArrowUp className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" disabled={idx === stageTemplates.length - 1} onClick={() => handleReorder(t, "down")}>
                                      <ArrowDown className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${channelCfg.color}`}>
                                    {channelCfg.label}
                                  </span>
                                  <span className="text-sm font-medium text-foreground flex-1">{t.title}</span>
                                  {!(t.is_active ?? true) && <Badge variant="outline" className="text-[10px]">inativo</Badge>}
                                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleToggleActive(t)}>
                                    {(t.is_active ?? true) ? "Desativar" : "Ativar"}
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(t)}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => setDeleteConfirm(t.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                {t.subject && <p className="text-xs text-muted-foreground pl-8"><span className="font-medium">Assunto:</span> {t.subject}</p>}
                                <p className="text-xs text-muted-foreground pl-8 whitespace-pre-line line-clamp-3">{t.body}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })
        )}
      </main>

      {/* Add Template Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Select value={addForm.stage} onValueChange={(v) => setAddForm((f) => ({ ...f, stage: v }))}>
                <SelectTrigger><SelectValue placeholder="Estágio" /></SelectTrigger>
                <SelectContent>
                  {STAGE_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={addForm.channel} onValueChange={(v) => setAddForm((f) => ({ ...f, channel: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input value={addForm.title} onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))} placeholder="Título do template" />
            {addForm.channel === "email" && (
              <Input value={addForm.subject} onChange={(e) => setAddForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Assunto do e-mail" />
            )}
            <Textarea
              value={addForm.body}
              onChange={(e) => setAddForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Texto do template. Use {{nome}}, {{empresa}}, {{cargo}}, etc."
              className="min-h-[150px] font-mono text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddDialog(false)}>Cancelar</Button>
            <Button disabled={!addForm.title.trim() || !addForm.body.trim()} onClick={handleAdd}>Criar Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover template?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita. Overrides de usuários serão removidos junto.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Templates;

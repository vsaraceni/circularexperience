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
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Pencil, Trash2, Save, X, ArrowUp, ArrowDown,
  Copy, Check, BookOpen, ChevronDown, ChevronUp, Search,
} from "lucide-react";
import { LogoImage } from "@/components/LogoImage";
import logo from "@/assets/movimento-circular-logo.png";

const CHANNEL_FILTERS = [
  { value: "all", label: "Todos os canais" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "E-mail" },
  { value: "linkedin", label: "LinkedIn" },
];

const Templates = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("manage_templates");
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
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title?: string; subject?: string | null; body?: string; channel?: string; product_id?: string | null }>({});
  const [addDialog, setAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({ stage: "novo", channel: "whatsapp" as string, title: "", subject: "", body: "", product_id: null as string | null });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (productFilter === "global" && t.product_id) return false;
      if (productFilter !== "all" && productFilter !== "global" && t.product_id !== productFilter) return false;
      if (channelFilter !== "all" && t.channel !== channelFilter) return false;
      if (q) {
        const haystack = `${t.title} ${t.subject ?? ""} ${t.body}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [templates, productFilter, channelFilter, search]);

  const grouped = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = filteredTemplates.filter((t) => t.stage === stage).sort((a, b) => a.sort_order - b.sort_order);
    return acc;
  }, {} as Record<string, MessageTemplate[]>);

  const totalVisible = filteredTemplates.length;

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

  const handleCopy = async (t: MessageTemplate) => {
    const text = t.channel === "email" && t.subject ? `Assunto: ${t.subject}\n\n${t.body}` : t.body;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(t.id);
      toast.success("Texto copiado! Lembre de preencher as variáveis antes de enviar.");
      window.setTimeout(() => setCopiedId((cur) => (cur === t.id ? null : cur)), 1800);
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto manualmente.");
    }
  };

  const toggleExpanded = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/admin/pipeline");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <LogoImage src={logo} alt="MC" className="h-8" />
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-foreground leading-tight">
              {canManage ? "Gerenciar Templates de Mensagem" : "Templates de Mensagem"}
            </h1>
            <span className="text-[11px] text-muted-foreground">
              {canManage ? "Padrão oficial da equipe — edite com cuidado" : "Biblioteca oficial de cadências da equipe"}
            </span>
          </div>
          <div className="flex-1" />
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar no texto..."
              aria-label="Buscar templates"
              className="h-8 w-[180px] pl-8 text-xs"
            />
          </div>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs" aria-label="Filtrar por canal"><SelectValue placeholder="Canal" /></SelectTrigger>
            <SelectContent>
              {CHANNEL_FILTERS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="h-8 w-[200px] text-xs" aria-label="Filtrar por produto"><SelectValue placeholder="Filtrar por produto" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os templates</SelectItem>
              <SelectItem value="global">Apenas globais</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canManage && (
            <Button size="sm" className="gap-1" onClick={() => setAddDialog(true)}>
              <Plus className="h-4 w-4" /> Novo Template
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {!canManage && (
          <div
            role="status"
            className="rounded-lg border p-3 flex items-start gap-3"
            style={{ background: "hsl(var(--color-bg-subtle))", borderColor: "hsl(var(--color-border))" }}
          >
            <BookOpen className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "hsl(var(--color-brand))" }} aria-hidden="true" />
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p className="text-sm font-medium text-foreground">Modo consulta</p>
              <p>
                Você pode ler e copiar qualquer script. Para usar sua própria versão de um template, personalize-o
                diretamente no painel do lead (bloco <strong>Mensagens</strong>). Alterações no padrão da equipe são feitas por gestores.
              </p>
            </div>
          </div>
        )}

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
        ) : totalVisible === 0 ? (
          <div className="text-center py-12 space-y-1">
            <p className="text-sm font-medium text-foreground">Nenhum template encontrado</p>
            <p className="text-xs text-muted-foreground">Ajuste a busca ou os filtros de canal e produto.</p>
          </div>
        ) : (
          STAGE_ORDER.map((stage) => {
            const stageTemplates = grouped[stage] || [];
            if (stageTemplates.length === 0 && (search || channelFilter !== "all" || productFilter !== "all")) return null;
            return (
              <section key={stage} aria-labelledby={`stage-${stage}`}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 id={`stage-${stage}`} className="text-base font-bold text-foreground">{STAGE_LABELS[stage]}</h2>
                  <Badge variant="secondary" className="text-xs">{stageTemplates.length}</Badge>
                </div>

                {stageTemplates.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic pl-2">Nenhum template neste estágio.</p>
                ) : (
                  <div className="space-y-3">
                    {stageTemplates.map((t, idx) => {
                      const isEditing = canManage && editingId === t.id;
                      const channelCfg = CHANNEL_CONFIG[t.channel];
                      const isExpanded = !!expanded[t.id];
                      const isLong = t.body.length > 220 || t.body.split("\n").length > 3;

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
                                  {canManage && (
                                    <div className="flex flex-col gap-0.5">
                                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0" disabled={idx === 0} onClick={() => handleReorder(t, "up")} aria-label="Mover para cima">
                                        <ArrowUp className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0" disabled={idx === stageTemplates.length - 1} onClick={() => handleReorder(t, "down")} aria-label="Mover para baixo">
                                        <ArrowDown className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${channelCfg.color}`}>
                                    {channelCfg.label}
                                  </span>
                                  <span className="text-sm font-medium text-foreground flex-1">{t.title}</span>
                                  <Badge
                                    variant={t.product_id ? "default" : "outline"}
                                    className="text-[10px]"
                                  >
                                    {t.product_id ? (productMap[t.product_id] ?? "Produto") : "Global"}
                                  </Badge>
                                  {!(t.is_active ?? true) && <Badge variant="outline" className="text-[10px]">inativo</Badge>}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs gap-1"
                                    onClick={() => handleCopy(t)}
                                    aria-label={`Copiar texto do template ${t.title}`}
                                  >
                                    {copiedId === t.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    {copiedId === t.id ? "Copiado" : "Copiar"}
                                  </Button>
                                  {canManage && (
                                    <>
                                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleToggleActive(t)}>
                                        {(t.is_active ?? true) ? "Desativar" : "Ativar"}
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(t)} aria-label={`Editar template ${t.title}`}>
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => setDeleteConfirm(t.id)} aria-label={`Remover template ${t.title}`}>
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                                {t.subject && <p className={`text-xs text-muted-foreground ${canManage ? "pl-8" : ""}`}><span className="font-medium">Assunto:</span> {t.subject}</p>}
                                <p className={`text-xs text-muted-foreground whitespace-pre-line ${canManage ? "pl-8" : ""} ${isExpanded ? "" : "line-clamp-3"}`}>{t.body}</p>
                                {isLong && (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpanded(t.id)}
                                    className={`text-[11px] font-medium inline-flex items-center gap-1 hover:underline ${canManage ? "ml-8" : ""}`}
                                    style={{ color: "hsl(var(--color-brand))" }}
                                    aria-expanded={isExpanded}
                                  >
                                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                    {isExpanded ? "Recolher" : "Ver texto completo"}
                                  </button>
                                )}
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
      {canManage && (
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
              <Select
                value={addForm.product_id ?? "__global__"}
                onValueChange={(v) => setAddForm((f) => ({ ...f, product_id: v === "__global__" ? null : v }))}
              >
                <SelectTrigger><SelectValue placeholder="Produto vinculado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__global__">Todos os produtos (global)</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
      )}

      {/* Delete Confirmation */}
      {canManage && (
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
      )}
    </div>
  );
};

export default Templates;

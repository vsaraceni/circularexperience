import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Upload, Star, Download, Trash2, FileText } from "lucide-react";
import CrmNavbar from "@/components/admin/CrmNavbar";
import { useNavigate } from "react-router-dom";
import RichTextEditor from "@/components/admin/RichTextEditor";

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  brand_color: string | null;
  is_active: boolean;
  sort_order: number;
  default_title_template: string | null;
  default_scope: string | null;
  default_considerations: string | null;
}

interface MasterAsset {
  id: string;
  product_id: string;
  version: string;
  label: string | null;
  storage_path: string;
  page_count: number | null;
  is_active: boolean;
  notes: string | null;
  uploaded_at: string;
}

const Products = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [masters, setMasters] = useState<MasterAsset[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [productDialog, setProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    slug: "",
    name: "",
    description: "",
    brand_color: "#5F2558",
    is_active: true,
    default_title_template: "",
    default_scope: "",
    default_considerations: "",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadVersion, setUploadVersion] = useState("");
  const [uploadLabel, setUploadLabel] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDialog, setUploadDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error("Acesso restrito a administradores");
      navigate("/admin/propostas");
    }
  }, [authLoading, isAdmin, navigate]);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("sort_order")
      .order("name");
    if (error) toast.error("Erro ao carregar produtos");
    else setProducts((data || []) as Product[]);
  }, []);

  const fetchMasters = useCallback(async (productId: string) => {
    const { data, error } = await supabase
      .from("proposal_master_assets")
      .select("*")
      .eq("product_id", productId)
      .order("uploaded_at", { ascending: false });
    if (error) toast.error("Erro ao carregar versões");
    else setMasters((data || []) as MasterAsset[]);
  }, []);

  useEffect(() => {
    fetchProducts().then(() => setLoading(false));
  }, [fetchProducts]);

  useEffect(() => {
    if (selectedProduct) fetchMasters(selectedProduct.id);
    else setMasters([]);
  }, [selectedProduct, fetchMasters]);

  const openProductDialog = (p?: Product) => {
    if (p) {
      setEditingProduct(p);
      setProductForm({
        slug: p.slug,
        name: p.name,
        description: p.description || "",
        brand_color: p.brand_color || "#5F2558",
        is_active: p.is_active,
        default_title_template: p.default_title_template || "",
        default_scope: p.default_scope || "",
        default_considerations: p.default_considerations || "",
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        slug: "",
        name: "",
        description: "",
        brand_color: "#5F2558",
        is_active: true,
        default_title_template: "",
        default_scope: "",
        default_considerations: "",
      });
    }
    setProductDialog(true);
  };

  const saveProduct = async () => {
    if (!productForm.slug || !productForm.name) { toast.error("Slug e nome são obrigatórios"); return; }
    const payload = {
      ...productForm,
      default_title_template: productForm.default_title_template.trim() || null,
      default_scope: productForm.default_scope.trim() || null,
      default_considerations: productForm.default_considerations.trim() || null,
    };
    if (editingProduct) {
      const { error } = await supabase.from("products").update(payload).eq("id", editingProduct.id);
      if (error) { toast.error("Erro ao atualizar produto"); return; }
      toast.success("Produto atualizado");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) { toast.error(`Erro: ${error.message}`); return; }
      toast.success("Produto criado");
    }
    setProductDialog(false);
    fetchProducts();
  };

  const handleUpload = async () => {
    if (!selectedProduct || !uploadFile || !uploadVersion) { toast.error("Versão e arquivo são obrigatórios"); return; }
    if (uploadFile.type !== "application/pdf") { toast.error("Apenas arquivos PDF"); return; }
    if (uploadFile.size > 20 * 1024 * 1024) { toast.error("Arquivo deve ter até 20MB"); return; }

    setUploading(true);
    try {
      const path = `${selectedProduct.slug}/${uploadVersion}-${Date.now()}.pdf`;
      const { error: upErr } = await supabase.storage.from("proposal-masters").upload(path, uploadFile, { contentType: "application/pdf" });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("proposal_master_assets").insert({
        product_id: selectedProduct.id,
        version: uploadVersion,
        label: uploadLabel || null,
        storage_path: path,
        is_active: masters.length === 0, // first upload becomes active
        uploaded_by: user!.id,
      });
      if (insErr) throw insErr;

      toast.success("PDF mestre enviado");
      setUploadFile(null); setUploadVersion(""); setUploadLabel(""); setUploadDialog(false);
      fetchMasters(selectedProduct.id);
    } catch (e: any) {
      toast.error(`Erro no upload: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const activateMaster = async (master: MasterAsset) => {
    if (!selectedProduct) return;
    // Deactivate others first, then activate this one (partial unique index requires this order)
    const { error: e1 } = await supabase.from("proposal_master_assets").update({ is_active: false }).eq("product_id", selectedProduct.id).neq("id", master.id);
    if (e1) { toast.error("Erro ao desativar outras versões"); return; }
    const { error: e2 } = await supabase.from("proposal_master_assets").update({ is_active: true }).eq("id", master.id);
    if (e2) { toast.error("Erro ao ativar versão"); return; }
    toast.success(`Versão ${master.version} ativada`);
    fetchMasters(selectedProduct.id);
  };

  const downloadMaster = async (master: MasterAsset) => {
    const { data, error } = await supabase.storage.from("proposal-masters").createSignedUrl(master.storage_path, 300);
    if (error || !data) { toast.error("Erro ao gerar link"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const deleteMaster = async (master: MasterAsset) => {
    if (!confirm(`Excluir versão ${master.version}?`)) return;
    await supabase.storage.from("proposal-masters").remove([master.storage_path]);
    const { error } = await supabase.from("proposal_master_assets").delete().eq("id", master.id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Versão excluída");
    if (selectedProduct) fetchMasters(selectedProduct.id);
  };

  if (loading || authLoading) {
    return (
      <div className="h-screen flex flex-col" style={{ background: 'hsl(var(--color-bg-page))' }}>
        <CrmNavbar currentModule="propostas" />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'hsl(var(--color-brand))' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ background: 'hsl(var(--color-bg-page))' }}>
      <CrmNavbar currentModule="propostas" />
      <main className="flex-1 overflow-auto container px-4 max-w-6xl py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'hsl(var(--color-text-primary))' }}>Produtos & PDFs Mestres</h1>
            <p className="text-sm text-muted-foreground mt-1">Catálogo de produtos comerciais e versões dos PDFs canônicos</p>
          </div>
          <Button size="sm" onClick={() => openProductDialog()} style={{ background: 'hsl(var(--color-brand))', color: 'white' }}>
            <Plus className="h-4 w-4 mr-1.5" /> Novo Produto
          </Button>
        </div>

        <div className="grid md:grid-cols-[280px_1fr] gap-4">
          {/* Lista de produtos */}
          <div className="space-y-2">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProduct(p)}
                className="w-full text-left p-3 rounded-lg border bg-white transition-all"
                style={{
                  borderColor: selectedProduct?.id === p.id ? 'hsl(var(--color-brand))' : 'hsl(var(--color-border))',
                  borderWidth: selectedProduct?.id === p.id ? 2 : 1,
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: p.brand_color || '#5F2558' }} />
                  <span className="font-medium text-sm truncate flex-1">{p.name}</span>
                  {!p.is_active && <span className="text-[10px] text-muted-foreground">inativo</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{p.slug}</p>
              </button>
            ))}
            {products.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum produto cadastrado</p>
            )}
          </div>

          {/* Detalhe do produto */}
          <div className="bg-white rounded-lg border p-4" style={{ borderColor: 'hsl(var(--color-border))' }}>
            {!selectedProduct ? (
              <div className="text-center text-muted-foreground py-12 text-sm">
                Selecione um produto à esquerda para gerenciar suas versões de PDF mestre
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold">{selectedProduct.name}</h2>
                    {selectedProduct.description && <p className="text-xs text-muted-foreground mt-0.5">{selectedProduct.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openProductDialog(selectedProduct)}>Editar</Button>
                    <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm" style={{ background: 'hsl(var(--color-brand))', color: 'white' }}>
                          <Upload className="h-4 w-4 mr-1.5" /> Novo PDF Mestre
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Upload de PDF Mestre</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          <div><Label>Versão *</Label><Input value={uploadVersion} onChange={(e) => setUploadVersion(e.target.value)} placeholder="v1, 2026-01..." /></div>
                          <div><Label>Rótulo</Label><Input value={uploadLabel} onChange={(e) => setUploadLabel(e.target.value)} placeholder="Versão jan/2026" /></div>
                          <div><Label>Arquivo PDF *</Label><Input type="file" accept="application/pdf" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} /></div>
                          <p className="text-xs text-muted-foreground">Máximo 20MB. Apenas PDF.</p>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setUploadDialog(false)} disabled={uploading}>Cancelar</Button>
                          <Button onClick={handleUpload} disabled={uploading} style={{ background: 'hsl(var(--color-brand))', color: 'white' }}>
                            {uploading ? "Enviando..." : "Enviar"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="space-y-2">
                  {masters.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg" style={{ borderColor: 'hsl(var(--color-border))' }}>
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      Nenhum PDF mestre. Faça o upload do primeiro.
                    </div>
                  )}
                  {masters.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-3 border rounded-lg" style={{ borderColor: 'hsl(var(--color-border))' }}>
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{m.version}</span>
                          {m.is_active && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: 'hsl(var(--color-brand-light))', color: 'hsl(var(--color-brand))' }}>
                              ATIVO
                            </span>
                          )}
                        </div>
                        {m.label && <p className="text-xs text-muted-foreground truncate">{m.label}</p>}
                        <p className="text-[11px] text-muted-foreground">{new Date(m.uploaded_at).toLocaleString("pt-BR")}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {!m.is_active && (
                          <Button size="sm" variant="outline" onClick={() => activateMaster(m)} title="Ativar"><Star className="h-3.5 w-3.5" /></Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => downloadMaster(m)} title="Baixar"><Download className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="outline" onClick={() => deleteMaster(m)} title="Excluir" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Dialog de produto */}
        <Dialog open={productDialog} onOpenChange={setProductDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingProduct ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Slug *</Label><Input value={productForm.slug} onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })} placeholder="circular-experience" disabled={!!editingProduct} /></div>
              <div><Label>Nome *</Label><Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} /></div>
              <div><Label>Descrição</Label><Input value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} /></div>
              <div><Label>Cor da marca</Label><Input type="color" value={productForm.brand_color} onChange={(e) => setProductForm({ ...productForm, brand_color: e.target.value })} className="h-10 w-20" /></div>
              <div className="flex items-center gap-2"><Switch checked={productForm.is_active} onCheckedChange={(v) => setProductForm({ ...productForm, is_active: v })} /><Label>Ativo</Label></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProductDialog(false)}>Cancelar</Button>
              <Button onClick={saveProduct} style={{ background: 'hsl(var(--color-brand))', color: 'white' }}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Products;

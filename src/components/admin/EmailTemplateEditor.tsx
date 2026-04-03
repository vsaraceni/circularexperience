import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail, Eye, Send, Clock, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "./RichTextEditor";

const VARIABLES_LEAD = [
  { key: "{{name}}", label: "Primeiro nome" },
  { key: "{{full_name}}", label: "Nome completo" },
  { key: "{{email}}", label: "Email do lead" },
  { key: "{{company}}", label: "Empresa" },
  { key: "{{cargo}}", label: "Cargo" },
];

const VARIABLES_SIGNATURE = [
  { key: "{{sender_name}}", label: "Nome do admin" },
  { key: "{{sender_email}}", label: "Email do admin" },
  { key: "{{sender_phone}}", label: "Telefone do admin" },
];

interface TransactionalPreview {
  templateName: string;
  displayName: string;
  subject: string;
  html: string;
  status: string;
}

const TRANSACTIONAL_META: Record<string, { icon: React.ReactNode; trigger: string; recipient: string }> = {
  "daily-digest": {
    icon: <Clock className="h-4 w-4" />,
    trigger: "Automático — todos os dias às 10h (seg-sex)",
    recipient: "Todos os admins",
  },
  "call-scheduled-alert": {
    icon: <Send className="h-4 w-4" />,
    trigger: "Quando lead avança para 'Call Agendada'",
    recipient: "Dono do lead (assigned_to)",
  },
  "daily-performance": {
    icon: <BarChart3 className="h-4 w-4" />,
    trigger: "Automático — todos os dias às 21h (seg-sex)",
    recipient: "Todos os admins",
  },
};

const EmailTemplateEditor = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [form, setForm] = useState({
    from_name: "",
    from_email: "",
    reply_to: "",
    subject: "",
    body_html: "",
  });
  const [transactionalPreviews, setTransactionalPreviews] = useState<TransactionalPreview[]>([]);
  const [loadingPreviews, setLoadingPreviews] = useState(false);

  const fetchTemplate = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("email_templates" as any)
      .select("id, from_name, from_email, reply_to, subject, body_html")
      .eq("slug", "lead-welcome")
      .single();

    if (data) {
      const d = data as any;
      setTemplateId(d.id);
      setForm({
        from_name: d.from_name || "",
        from_email: d.from_email || "",
        reply_to: d.reply_to || "",
        subject: d.subject || "",
        body_html: d.body_html || "",
      });
    }
    setLoading(false);
  };

  const fetchTransactionalPreviews = async () => {
    setLoadingPreviews(true);
    try {
      const { data, error } = await supabase.functions.invoke("preview-transactional-email", {
        method: "POST",
      });
      if (!error && data?.templates) {
        setTransactionalPreviews(data.templates);
      }
    } catch (err) {
      console.error("Failed to load transactional previews", err);
    }
    setLoadingPreviews(false);
  };

  useEffect(() => {
    if (open) {
      fetchTemplate();
      fetchTransactionalPreviews();
    }
  }, [open]);

  const handleSave = async () => {
    if (!templateId) return;
    setSaving(true);
    const { error } = await supabase
      .from("email_templates" as any)
      .update({
        from_name: form.from_name,
        from_email: form.from_email,
        reply_to: form.reply_to,
        subject: form.subject,
        body_html: form.body_html,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", templateId);

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar template");
      console.error(error);
    } else {
      toast.success("Template de email atualizado!");
    }
  };

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Mail className="h-4 w-4 mr-1" /> Configurar Emails
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" style={{ color: 'hsl(var(--color-brand))' }} />
            Central de Emails
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="welcome" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-4">
            <TabsTrigger value="welcome" className="text-xs">Boas-Vindas</TabsTrigger>
            <TabsTrigger value="daily-digest" className="text-xs">Missões do Dia</TabsTrigger>
            <TabsTrigger value="call-scheduled-alert" className="text-xs">Alerta Proposta</TabsTrigger>
            <TabsTrigger value="daily-performance" className="text-xs">Performance</TabsTrigger>
          </TabsList>

          {/* Welcome email - editable */}
          <TabsContent value="welcome">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border p-3 mb-2" style={{ background: 'hsl(var(--color-bg-subtle))', borderColor: 'hsl(var(--color-border))' }}>
                  <div className="flex items-center gap-2 text-sm font-medium mb-1">
                    <Send className="h-4 w-4" style={{ color: 'hsl(var(--color-brand))' }} />
                    Email editável
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enviado quando o operador clica em "Boas-Vindas" no lead. Template salvo no banco.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Remetente</Label>
                    <Input value={form.from_name} onChange={(e) => set("from_name", e.target.value)} placeholder="Muti CRM" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email do Remetente</Label>
                    <Input value={form.from_email} onChange={(e) => set("from_email", e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Responder Para (Reply-To)</Label>
                  <Input value={form.reply_to} onChange={(e) => set("reply_to", e.target.value)} />
                  <p className="text-xs text-muted-foreground">
                    Quando o lead responder, a resposta será enviada para este endereço.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Assunto</Label>
                  <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Corpo do Email</Label>
                  <RichTextEditor value={form.body_html} onChange={(html) => set("body_html", html)} />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Variáveis do Lead:</Label>
                  <div className="flex flex-wrap gap-2">
                    {VARIABLES_LEAD.map((v) => (
                      <Badge key={v.key} variant="secondary" className="cursor-pointer select-all font-mono text-xs"
                        onClick={() => { navigator.clipboard.writeText(v.key); toast.info(`${v.key} copiado!`); }}>
                        {v.key} — {v.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Variáveis de Assinatura:</Label>
                  <div className="flex flex-wrap gap-2">
                    {VARIABLES_SIGNATURE.map((v) => (
                      <Badge key={v.key} variant="outline" className="cursor-pointer select-all font-mono text-xs"
                        onClick={() => { navigator.clipboard.writeText(v.key); toast.info(`${v.key} copiado!`); }}>
                        {v.key} — {v.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? "Salvando..." : "Salvar Template"}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Transactional email previews */}
          {["daily-digest", "call-scheduled-alert", "daily-performance"].map((templateName) => {
            const preview = transactionalPreviews.find((p) => p.templateName === templateName);
            const meta = TRANSACTIONAL_META[templateName];

            return (
              <TabsContent key={templateName} value={templateName}>
                {loadingPreviews ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-lg border p-3" style={{ background: 'hsl(var(--color-bg-subtle))', borderColor: 'hsl(var(--color-border))' }}>
                      <div className="flex items-center gap-2 text-sm font-medium mb-2">
                        {meta?.icon}
                        <span style={{ color: 'hsl(var(--color-brand))' }}>
                          {preview?.displayName || templateName}
                        </span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          <Eye className="h-3 w-3 mr-1" /> Somente visualização
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div><strong>Gatilho:</strong> {meta?.trigger}</div>
                        <div><strong>Destinatário:</strong> {meta?.recipient}</div>
                      </div>
                      {preview?.subject && (
                        <div className="text-xs mt-2">
                          <strong>Assunto:</strong> {preview.subject}
                        </div>
                      )}
                    </div>

                    {preview?.status === "ready" && preview.html ? (
                      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'hsl(var(--color-border))' }}>
                        <iframe
                          srcDoc={preview.html}
                          title={`Preview: ${preview.displayName}`}
                          className="w-full bg-white"
                          style={{ minHeight: 500, border: "none" }}
                          sandbox="allow-same-origin"
                        />
                      </div>
                    ) : preview?.status === "render_failed" ? (
                      <div className="text-center py-8 text-sm text-destructive">
                        Erro ao renderizar preview do template.
                      </div>
                    ) : (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        Preview não disponível para este template.
                      </div>
                    )}

                    <div className="rounded-md border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
                      Este template é gerenciado por código. Para alterações, entre em contato com o desenvolvedor.
                    </div>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EmailTemplateEditor;

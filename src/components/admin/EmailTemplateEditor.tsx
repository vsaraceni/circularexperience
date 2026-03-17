import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "./RichTextEditor";

const VARIABLES = [
  { key: "{{name}}", label: "Nome" },
  { key: "{{email}}", label: "Email" },
  { key: "{{company}}", label: "Empresa" },
  { key: "{{cargo}}", label: "Cargo" },
];

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

  useEffect(() => {
    if (open) fetchTemplate();
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
      setOpen(false);
    }
  };

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Mail className="h-4 w-4 mr-1" /> Email de Boas-Vindas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email de Boas-Vindas ao Lead</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Remetente</Label>
                <Input
                  value={form.from_name}
                  onChange={(e) => set("from_name", e.target.value)}
                  placeholder="Circular Experience"
                />
              </div>
              <div className="space-y-2">
                <Label>Email do Remetente</Label>
                <Input
                  value={form.from_email}
                  onChange={(e) => set("from_email", e.target.value)}
                  placeholder="contato@notify.escolas.movimentocircular.io"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Responder Para (Reply-To)</Label>
              <Input
                value={form.reply_to}
                onChange={(e) => set("reply_to", e.target.value)}
                placeholder="contato@movimentocircular.io"
              />
              <p className="text-xs text-muted-foreground">
                Quando o lead responder o email, a resposta será enviada para este endereço.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Assunto</Label>
              <Input
                value={form.subject}
                onChange={(e) => set("subject", e.target.value)}
                placeholder="Obrigado pelo seu interesse, {{name}}!"
              />
            </div>

            <div className="space-y-2">
              <Label>Corpo do Email</Label>
              <RichTextEditor
                value={form.body_html}
                onChange={(html) => set("body_html", html)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Variáveis disponíveis (copie e cole no assunto ou corpo):</Label>
              <div className="flex flex-wrap gap-2">
                {VARIABLES.map((v) => (
                  <Badge
                    key={v.key}
                    variant="secondary"
                    className="cursor-pointer select-all font-mono text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(v.key);
                      toast.info(`${v.key} copiado!`);
                    }}
                  >
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
      </DialogContent>
    </Dialog>
  );
};

export default EmailTemplateEditor;

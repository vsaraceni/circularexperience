import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye, RotateCcw, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "./RichTextEditor";

const TEMPLATE_SLUG = "lead-welcome";

const VARIABLES = [
  { key: "{{name}}", label: "Primeiro nome" },
  { key: "{{full_name}}", label: "Nome completo" },
  { key: "{{email}}", label: "Email do lead" },
  { key: "{{company}}", label: "Empresa" },
  { key: "{{cargo}}", label: "Cargo" },
  { key: "{{sender_name}}", label: "Seu nome" },
  { key: "{{sender_email}}", label: "Seu email" },
  { key: "{{sender_phone}}", label: "Seu telefone" },
];

interface Props {
  userId: string | undefined;
}

/**
 * Personalização individual do e-mail de boas-vindas.
 * Cada usuário parte do texto padrão da equipe e salva a própria versão
 * em user_email_overrides (RLS: só o dono lê/escreve).
 */
const MyWelcomeEmail: React.FC<Props> = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasOverride, setHasOverride] = useState(false);
  const [base, setBase] = useState({ subject: "", body_html: "" });
  const [form, setForm] = useState({ subject: "", body_html: "" });

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    const [baseRes, ownRes] = await Promise.all([
      supabase.rpc("get_email_template_base", { p_slug: TEMPLATE_SLUG }),
      supabase
        .from("user_email_overrides")
        .select("subject, body_html")
        .eq("user_id", userId)
        .eq("template_slug", TEMPLATE_SLUG)
        .maybeSingle(),
    ]);

    const baseRow = Array.isArray(baseRes.data) ? baseRes.data[0] : baseRes.data;
    const baseValues = {
      subject: (baseRow as any)?.subject || "",
      body_html: (baseRow as any)?.body_html || "",
    };
    setBase(baseValues);

    const own = ownRes.data as { subject: string | null; body_html: string | null } | null;
    if (own) {
      setHasOverride(true);
      setForm({
        subject: own.subject ?? baseValues.subject,
        body_html: own.body_html ?? baseValues.body_html,
      });
    } else {
      setHasOverride(false);
      setForm(baseValues);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    if (!form.subject.trim()) {
      toast.error("Informe o assunto do e-mail.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("user_email_overrides").upsert(
      {
        user_id: userId,
        template_slug: TEMPLATE_SLUG,
        subject: form.subject,
        body_html: form.body_html,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,template_slug" },
    );
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar seu e-mail");
      console.error(error);
      return;
    }
    setHasOverride(true);
    toast.success("Seu e-mail de boas-vindas foi salvo!");
  };

  const handleReset = async () => {
    if (!userId) return;
    await supabase
      .from("user_email_overrides")
      .delete()
      .eq("user_id", userId)
      .eq("template_slug", TEMPLATE_SLUG);
    setHasOverride(false);
    setForm(base);
    toast.info("Texto restaurado para o padrão da equipe.");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-lg border p-3"
        style={{ background: "hsl(var(--color-bg-subtle))", borderColor: "hsl(var(--color-border))" }}
      >
        <div className="flex items-center gap-2 text-sm font-medium mb-1">
          <Sparkles className="h-4 w-4" style={{ color: "hsl(var(--color-brand))" }} />
          Seu e-mail de boas-vindas
          {hasOverride && (
            <Badge variant="secondary" className="text-[10px]">
              personalizado
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Este é o texto usado quando <strong>você</strong> dispara o e-mail de boas-vindas pelo Kanban. Se não
          personalizar, o padrão da equipe é usado. Envios automáticos de leads novos seguem sempre o padrão.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Assunto</Label>
        <Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
      </div>

      <div className="space-y-2">
        <Label>Corpo do e-mail (texto e imagens)</Label>
        <RichTextEditor value={form.body_html} onChange={(html) => setForm((f) => ({ ...f, body_html: html }))} />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Variáveis disponíveis:</Label>
        <div className="flex flex-wrap gap-2">
          {VARIABLES.map((v) => (
            <Badge
              key={v.key}
              variant="outline"
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

      <div className="border rounded-lg overflow-hidden" style={{ borderColor: "hsl(var(--color-border))" }}>
        <div
          className="bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-1.5 border-b"
          style={{ borderColor: "hsl(var(--color-border))" }}
        >
          <Eye className="h-3 w-3" /> Preview
        </div>
        <iframe
          srcDoc={form.body_html}
          title="Preview do meu e-mail de boas-vindas"
          className="w-full bg-white"
          style={{ minHeight: 320, border: "none" }}
          sandbox=""
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          <Save className="h-4 w-4 mr-1" />
          {saving ? "Salvando..." : "Salvar meu e-mail"}
        </Button>
        <Button variant="ghost" onClick={handleReset} disabled={!hasOverride} className="text-muted-foreground">
          <RotateCcw className="h-4 w-4 mr-1" /> Restaurar padrão
        </Button>
      </div>
    </div>
  );
};

export default MyWelcomeEmail;

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { LeadSourceRow } from "@/hooks/useLeadSources";

export interface IntegrationFormValues {
  slug: string;
  nome: string;
  cors_origins: string[];
  rate_limit_per_min: number;
  default_stage: string;
  email_notificar: string[];
  capi_habilitado: boolean;
  custom_field_schema: Record<string, unknown>;
  notas: string;
  whatsapp_auto_send: boolean;
  whatsapp_channel_id: string | null;
  produto_label: string | null;
  whatsapp_agent_id: string | null;
  whatsapp_initial_message: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  source?: LeadSourceRow | null;
  onSubmit: (values: IntegrationFormValues) => Promise<void>;
}

const STAGES = ["novo", "boas_vindas", "em_contato", "call_agendada", "proposta", "nutricao", "tratativas"];

export default function IntegrationFormDialog({ open, onOpenChange, source, onSubmit }: Props) {
  const editing = !!source;
  const [submitting, setSubmitting] = useState(false);

  const [slug, setSlug] = useState("");
  const [nome, setNome] = useState("");
  const [corsOrigins, setCorsOrigins] = useState<string[]>([]);
  const [corsInput, setCorsInput] = useState("");
  const [rateLimit, setRateLimit] = useState(30);
  const [defaultStage, setDefaultStage] = useState("novo");
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [capi, setCapi] = useState(false);
  const [whatsappAuto, setWhatsappAuto] = useState(false);
  const [whatsappChannelId, setWhatsappChannelId] = useState("");
  const [whatsappAgentId, setWhatsappAgentId] = useState("");
  const [produtoLabel, setProdutoLabel] = useState("");
  const [whatsappInitialMessage, setWhatsappInitialMessage] = useState("");
  const [schemaText, setSchemaText] = useState("{}");
  const [notas, setNotas] = useState("");
  const [schemaError, setSchemaError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSlug(source?.slug ?? "");
    setNome(source?.nome ?? "");
    setCorsOrigins(source?.cors_origins ?? []);
    setRateLimit(source?.rate_limit_per_min ?? 30);
    setDefaultStage(source?.default_stage ?? "novo");
    setEmails(source?.email_notificar ?? []);
    setCapi(source?.capi_habilitado ?? false);
    setWhatsappAuto(source?.whatsapp_auto_send ?? false);
    setWhatsappChannelId(source?.whatsapp_channel_id ?? "");
    setWhatsappAgentId(source?.whatsapp_agent_id ?? "");
    setProdutoLabel(source?.produto_label ?? "");
    setWhatsappInitialMessage(source?.whatsapp_initial_message ?? "");
    setSchemaText(JSON.stringify(source?.custom_field_schema ?? {}, null, 2));
    setNotas(source?.notas ?? "");
    setCorsInput("");
    setEmailInput("");
    setSchemaError("");
  }, [open, source]);

  const addCors = () => {
    const v = corsInput.trim();
    if (!v) return;
    if (!corsOrigins.includes(v)) setCorsOrigins([...corsOrigins, v]);
    setCorsInput("");
  };
  const removeCors = (v: string) => setCorsOrigins(corsOrigins.filter((c) => c !== v));

  const addEmail = () => {
    const v = emailInput.trim();
    if (!v) return;
    if (!emails.includes(v)) setEmails([...emails, v]);
    setEmailInput("");
  };
  const removeEmail = (v: string) => setEmails(emails.filter((e) => e !== v));

  const handleSubmit = async () => {
    let schema: Record<string, unknown> = {};
    try {
      schema = JSON.parse(schemaText || "{}");
      setSchemaError("");
    } catch {
      setSchemaError("JSON inválido");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        slug,
        nome,
        cors_origins: corsOrigins,
        rate_limit_per_min: rateLimit,
        default_stage: defaultStage,
        email_notificar: emails,
        capi_habilitado: capi,
        custom_field_schema: schema,
        notas,
        whatsapp_auto_send: whatsappAuto,
        whatsapp_channel_id: whatsappChannelId.trim() || null,
        whatsapp_agent_id: whatsappAgentId.trim() || null,
        produto_label: produtoLabel.trim() || null,
        whatsapp_initial_message: whatsappInitialMessage.trim() || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? `Editar: ${source?.nome}` : "Nova integração"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Slug *</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="lp_ce"
                disabled={editing}
              />
              <p className="text-xs text-muted-foreground">a-z, 0-9, _ (3-32 chars)</p>
            </div>
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Landing Page Circular Experience" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Produto / contexto humano</Label>
            <Input
              value={produtoLabel}
              onChange={(e) => setProdutoLabel(e.target.value)}
              placeholder="Ex: Circular Experience — workshop/imersão de economia circular"
            />
            <p className="text-xs text-muted-foreground">
              Texto que vai pro agente do WhatsApp como contexto. Se vazio, usa o nome da fonte. A campanha específica vem do <code className="text-[10px]">utm_campaign</code> ou de <code className="text-[10px]">custom_fields.campanha_label</code> do anúncio.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Domínios permitidos (CORS)</Label>
            <div className="flex gap-2">
              <Input
                value={corsInput}
                onChange={(e) => setCorsInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCors(); } }}
                placeholder="https://exemplo.com"
              />
              <Button type="button" variant="outline" onClick={addCors}>Adicionar</Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {corsOrigins.length === 0 && (
                <span className="text-xs text-amber-600">Vazio = libera todas as origens (use só em dev)</span>
              )}
              {corsOrigins.map((c) => (
                <Badge key={c} variant="secondary" className="gap-1">
                  {c}
                  <button onClick={() => removeCors(c)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Rate limit (req/min)</Label>
              <Input type="number" value={rateLimit} onChange={(e) => setRateLimit(Number(e.target.value))} min={1} max={1000} />
            </div>
            <div className="space-y-1.5">
              <Label>Stage inicial</Label>
              <select
                value={defaultStage}
                onChange={(e) => setDefaultStage(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Emails para notificar</Label>
            <div className="flex gap-2">
              <Input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEmail(); } }}
                placeholder="vendas@empresa.com"
              />
              <Button type="button" variant="outline" onClick={addEmail}>Adicionar</Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {emails.map((e) => (
                <Badge key={e} variant="secondary" className="gap-1">
                  {e}
                  <button onClick={() => removeEmail(e)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Enviar evento Meta CAPI</Label>
              <p className="text-xs text-muted-foreground">Dispara conversão no Meta Ads ao receber lead</p>
            </div>
            <Switch checked={capi} onCheckedChange={setCapi} />
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Disparar WhatsApp automático (GPT Maker)</Label>
                <p className="text-xs text-muted-foreground">
                  Inicia conversa via GPT Maker quando o lead chega. Bloqueia reenvio nas próximas 24h.
                </p>
              </div>
              <Switch checked={whatsappAuto} onCheckedChange={setWhatsappAuto} />
            </div>
            {whatsappAuto && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Channel ID específico (opcional)</Label>
                  <Input
                    value={whatsappChannelId}
                    onChange={(e) => setWhatsappChannelId(e.target.value)}
                    placeholder="Deixe vazio para usar o canal padrão"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Agent ID do GPT Maker (opcional)</Label>
                  <Input
                    value={whatsappAgentId}
                    onChange={(e) => setWhatsappAgentId(e.target.value)}
                    placeholder="Deixe vazio para usar o agente padrão"
                    className="text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Se preenchido, o briefing do lead viaja em <code>metadata</code> para este agente — sem virar mensagem visível e sem criar thread duplicada.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Mensagem inicial no WhatsApp</Label>
                  <Textarea
                    value={whatsappInitialMessage}
                    onChange={(e) => setWhatsappInitialMessage(e.target.value)}
                    rows={3}
                    placeholder="Oi {{primeiro_nome}}! 👋 Vi seu interesse em {{produto}}. Posso te contar mais? 😊"
                    className="text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Variáveis: <code>{"{{primeiro_nome}}"}</code>, <code>{"{{nome}}"}</code>, <code>{"{{produto}}"}</code>, <code>{"{{empresa}}"}</code>, <code>{"{{campanha}}"}</code>. Se vazio, usa o padrão global.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Schema de custom fields (JSON)</Label>
            <Textarea
              value={schemaText}
              onChange={(e) => setSchemaText(e.target.value)}
              rows={4}
              className="font-mono text-xs"
            />
            {schemaError && <p className="text-xs text-destructive">{schemaError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Notas internas</Label>
            <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting || !slug || !nome}>
            {submitting ? "Salvando..." : editing ? "Salvar" : "Criar e gerar chave"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
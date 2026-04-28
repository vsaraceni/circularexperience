import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import type { LeadSourceRow } from "@/hooks/useLeadSources";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  source: LeadSourceRow | null;
}

const ENDPOINT = "https://gxqrmxhpltfkkhhtqvmh.supabase.co/functions/v1/ingest-lead";

export default function IntegrationGuideDialog({ open, onOpenChange, source }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!source) return null;

  const apiKeyPlaceholder = `${source.api_key_prefix}...<sua_chave_completa>`;

  const curlSnippet = `curl -X POST ${ENDPOINT} \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKeyPlaceholder}" \\
  -d '{
    "source": "${source.slug}",
    "name": "Nome do Lead",
    "email": "lead@empresa.com",
    "telefone": "+5511999999999",
    "company": "Empresa LTDA",
    "cargo": "Diretor",
    "utm": {
      "source": "google",
      "medium": "cpc",
      "campaign": "lancamento"
    }
  }'`;

  const jsSnippet = `// Captura UTMs da URL
const params = new URLSearchParams(window.location.search);
const utm = {
  source: params.get("utm_source") || undefined,
  medium: params.get("utm_medium") || undefined,
  campaign: params.get("utm_campaign") || undefined,
  content: params.get("utm_content") || undefined,
  term: params.get("utm_term") || undefined,
};

await fetch("${ENDPOINT}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "${apiKeyPlaceholder}",
  },
  body: JSON.stringify({
    source: "${source.slug}",
    name: form.name,
    email: form.email,
    telefone: form.telefone,
    company: form.company,
    cargo: form.cargo,
    utm,
    custom_fields: { /* qualquer dado extra */ },
  }),
});`;

  const fields = `Campos aceitos no payload:

• source (obrigatório) — deve ser exatamente: "${source.slug}"
• name (obrigatório) — nome completo
• email (obrigatório) — email válido
• telefone (opcional)
• company (opcional)
• cargo (opcional)
• utm (opcional) — { source, medium, campaign, content, term }
• custom_fields (opcional) — objeto livre para dados extras
• consent_marketing (opcional) — boolean
• trigger_capi (opcional) — força disparo de evento Meta

Respostas:
• 201 Created — lead novo cadastrado
• 200 OK com status "duplicate" — email já existe (ainda é sucesso)
• 400 — payload inválido
• 401 — chave inválida
• 403 — origem (CORS) não permitida
• 429 — rate limit excedido (atual: ${source.rate_limit_per_min}/min)`;

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Copiado");
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadGuide = () => {
    const md = `# Integração CRM Muti — ${source.nome}

## Endpoint
\`POST ${ENDPOINT}\`

## Headers
- \`Content-Type: application/json\`
- \`x-api-key: ${apiKeyPlaceholder}\`

## Slug da fonte
\`${source.slug}\`

## Exemplo cURL
\`\`\`bash
${curlSnippet}
\`\`\`

## Exemplo JavaScript
\`\`\`javascript
${jsSnippet}
\`\`\`

## ${fields}
`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `integracao-${source.slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Como integrar: {source.nome}</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground">
          Use sua chave completa (que foi mostrada apenas na criação/rotação) no lugar do placeholder.
          Se perdeu, rotacione para gerar uma nova.
        </div>

        <Tabs defaultValue="curl" className="mt-2">
          <TabsList>
            <TabsTrigger value="curl">cURL</TabsTrigger>
            <TabsTrigger value="js">JavaScript</TabsTrigger>
            <TabsTrigger value="fields">Campos & Respostas</TabsTrigger>
          </TabsList>

          <TabsContent value="curl" className="space-y-2">
            <div className="relative">
              <pre className="bg-muted/50 rounded-lg p-4 text-xs overflow-x-auto">{curlSnippet}</pre>
              <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={() => copy(curlSnippet, "curl")}>
                <Copy className="h-3 w-3 mr-1" /> {copied === "curl" ? "Copiado" : "Copiar"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="js" className="space-y-2">
            <div className="relative">
              <pre className="bg-muted/50 rounded-lg p-4 text-xs overflow-x-auto">{jsSnippet}</pre>
              <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={() => copy(jsSnippet, "js")}>
                <Copy className="h-3 w-3 mr-1" /> {copied === "js" ? "Copiado" : "Copiar"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="fields">
            <pre className="bg-muted/50 rounded-lg p-4 text-xs whitespace-pre-wrap">{fields}</pre>
          </TabsContent>
        </Tabs>

        <Button variant="outline" onClick={downloadGuide} className="w-full mt-2">
          <Download className="h-4 w-4 mr-2" /> Baixar guia completo (.md)
        </Button>
      </DialogContent>
    </Dialog>
  );
}
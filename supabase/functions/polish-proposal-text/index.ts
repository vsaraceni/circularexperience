import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createOpenAI } from "npm:@ai-sdk/openai";
import { streamText } from "npm:ai";
import { z } from "npm:zod@3";

const Body = z.object({
  text: z.string().min(1).max(30000),
  field: z.enum(["scope", "considerations"]),
  title: z.string().max(500).optional(),
  company: z.string().max(300).optional(),
});

const SYSTEM = `Você é revisor sênior de propostas comerciais B2B (português do Brasil).
Revise APENAS ortografia, gramática, concordância, pontuação, clareza e formatação.
REGRAS INVIOLÁVEIS:
- NÃO adicione, remova ou invente informações, entregáveis, números, preços, prazos, datas, nomes ou cláusulas.
- Preserve o significado e a ordem das ideias; mantenha todos os itens existentes.
- Formate em HTML semântico simples: <p>, <ul><li>, <ol><li>, <strong>, <em>. Sem estilos, sem classes, sem títulos <h1>.
- Responda SOMENTE com o fragmento HTML final, sem markdown, sem \`\`\`, sem comentários.`;

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Não autenticado" }, 401);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await sb.auth.getUser(auth.slice(7));
    if (!u?.user) return json({ error: "Não autenticado" }, 401);
    const { data: member } = await sb.rpc("is_crm_member", { _user_id: u.user.id });
    if (!member) return json({ error: "Acesso negado" }, 403);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Dados inválidos" }, 400);
    const { text, field, title, company } = parsed.data;

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "IA não configurada" }, 500);
    let runId: string | undefined;
    const openai = createOpenAI({
      apiKey: key,
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: async (input, init) => {
        const h = new Headers(init?.headers);
        if (runId) h.set("X-Lovable-AIG-Run-ID", runId);
        const r = await fetch(input, { ...init, headers: h });
        runId ??= r.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
        if (!r.ok) throw Object.assign(new Error(await r.clone().text()), { status: r.status });
        return r;
      },
    });

    const label = field === "scope" ? "Definição do Escopo" : "Considerações";
    const result = streamText({
      model: openai.responses("openai/gpt-6-astra"),
      system: SYSTEM,
      prompt: `Campo: ${label}\nProposta: ${title ?? "-"}\nCliente: ${company ?? "-"}\n\nTexto original (HTML):\n${text}`,
      providerOptions: {
        openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] },
      },
    });
    let out = "";
    let err: any;
    try {
      for await (const part of result.fullStream) {
        if (part.type === "text-delta") out += (part as any).text ?? (part as any).textDelta ?? "";
        if (part.type === "error") err = (part as any).error;
      }
    } catch (e) { err = e; }
    if (err) {
      const status = err?.status ?? err?.statusCode ?? 500;
      const msg = status === 429 ? "Muitas solicitações, tente em instantes." : status === 402 ? "Créditos de IA esgotados." : "Falha ao revisar o texto.";
      console.error("polish error", status, String(err?.message ?? err));
      return json({ error: msg }, status);
    }
    out = out.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();
    if (!out) return json({ error: "A IA não retornou texto." }, 502);
    return json({ html: out });
  } catch (e) {
    console.error(e);
    return json({ error: "Erro interno" }, 500);
  }
});

// supabase/functions/enrich-organization/index.ts
//
// Enriquece o cadastro de ORGANIZAÇÕES (Firecrawl + IA).
//
// POST { organization_id }                          → enriquece uma org
// POST { tiers: [1,2], limit: 25, force?: boolean } → lote por tier
//
// Regras:
// - Só grava campo que está VAZIO no cadastro (nunca sobrescreve dado humano).
// - Só grava quando a IA reporta confiança ALTA para aquele campo.
// - Campos listados em organizations.manual_fields nunca são tocados.
// - Org enriquecida há menos de 180 dias é pulada (a não ser com force).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const FRESH_DAYS = 180;

type Conf = "alta" | "media" | "baixa";
interface FieldOut<T> { value: T | null; confianca: Conf }

interface AiOut {
  setor?: FieldOut<string>;
  segmento?: FieldOut<string>;
  porte?: FieldOut<string>;
  faixa_funcionarios?: FieldOut<string>;
  faixa_faturamento?: FieldOut<string>;
  cidade?: FieldOut<string>;
  uf?: FieldOut<string>;
  pais?: FieldOut<string>;
  linkedin_url?: FieldOut<string>;
  is_multinational?: FieldOut<boolean>;
  maturidade_esg?: FieldOut<number>;
  temas_interesse?: FieldOut<string[]>;
  descricao?: FieldOut<string>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Auth: service role interno OU usuário admin autenticado
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (token !== serviceKey) {
    if (!token) return json({ ok: false, error: "unauthorized" }, 401);
    const { data: userData } = await supabase.auth.getUser(token);
    const uid = userData?.user?.id;
    if (!uid) return json({ ok: false, error: "unauthorized" }, 401);
    const { data: isAdmin } = await supabase.rpc("is_admin", { uid });
    if (!isAdmin) return json({ ok: false, error: "forbidden" }, 403);
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty */ }

  const force = body.force === true;
  const orgId = typeof body.organization_id === "string" ? body.organization_id : null;
  const tiers = Array.isArray(body.tiers) ? (body.tiers as number[]) : [1, 2];
  const limit = Math.min(Number(body.limit) || 20, 50);

  let query = supabase
    .from("organizations")
    .select("id, name, domain, website, descricao, setor, segmento, porte, faixa_funcionarios, faixa_faturamento, cidade, uf, pais, linkedin_url, is_multinational, maturidade_esg, temas_interesse, manual_fields, enriched_at, tier");

  if (orgId) query = query.eq("id", orgId);
  else query = query.in("tier", tiers).order("enriched_at", { ascending: true, nullsFirst: true }).limit(limit);

  const { data: orgs, error } = await query;
  if (error) return json({ ok: false, error: error.message }, 500);
  if (!orgs?.length) return json({ ok: true, processed: 0, results: [] });

  const runAll = async () => {
    const results: unknown[] = [];
    const queue = [...orgs];
    const worker = async () => {
      while (queue.length) {
        const org = queue.shift();
        if (!org) return;
        try {
          results.push(await enrichOne(supabase, org, force));
        } catch (e) {
          results.push({ id: org.id, name: org.name, status: "error", error: e instanceof Error ? e.message : String(e) });
        }
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    return results;
  };

  // Lote grande roda em background para não estourar o timeout da requisição.
  if (body.background === true) {
    // @ts-ignore EdgeRuntime global do Supabase
    EdgeRuntime.waitUntil(runAll().then((r) => console.log("batch done", JSON.stringify(r))));
    return json({ ok: true, queued: orgs.length });
  }

  const results = await runAll();
  return json({ ok: true, processed: results.length, results });
});

async function enrichOne(supabase: any, org: any, force: boolean) {
  if (!force && org.enriched_at) {
    const days = (Date.now() - new Date(org.enriched_at).getTime()) / 86400000;
    if (days < FRESH_DAYS) return { id: org.id, name: org.name, status: "skipped", reason: "fresh" };
  }

  const site = (org.website || (org.domain ? `https://${org.domain}` : "")).trim();
  const markdown = await scrapeSite(site, org.name);

  const ai = await extractWithAI({
    name: org.name,
    site,
    descricao: org.descricao || "",
    snippet: markdown.slice(0, 6000),
  });
  if (!ai) return { id: org.id, name: org.name, status: "error", error: "ai_failed" };

  const manual: string[] = Array.isArray(org.manual_fields) ? org.manual_fields : [];
  const patch: Record<string, unknown> = {};
  const applied: string[] = [];

  const put = (field: string, out: FieldOut<any> | undefined, isEmpty: boolean, coerce?: (v: any) => any) => {
    if (!out || out.confianca !== "alta" || out.value === null || out.value === undefined || out.value === "") return;
    if (manual.includes(field) || !isEmpty) return;
    patch[field] = coerce ? coerce(out.value) : out.value;
    applied.push(field);
  };

  const blank = (v: any) => v === null || v === undefined || v === "";

  put("setor", ai.setor, blank(org.setor));
  put("segmento", ai.segmento, blank(org.segmento));
  put("porte", ai.porte, blank(org.porte));
  put("faixa_funcionarios", ai.faixa_funcionarios, blank(org.faixa_funcionarios));
  put("faixa_faturamento", ai.faixa_faturamento, blank(org.faixa_faturamento));
  put("cidade", ai.cidade, blank(org.cidade));
  put("uf", ai.uf, blank(org.uf), (v: string) => String(v).toUpperCase().slice(0, 2));
  put("pais", ai.pais, blank(org.pais));
  put("linkedin_url", ai.linkedin_url, blank(org.linkedin_url), (v: string) => String(v).startsWith("http") ? v : `https://${v}`);
  put("descricao", ai.descricao, blank(org.descricao));
  put("maturidade_esg", ai.maturidade_esg, blank(org.maturidade_esg), (v: any) => Math.max(1, Math.min(5, Math.round(Number(v)))));
  put("temas_interesse", ai.temas_interesse, !org.temas_interesse || org.temas_interesse.length === 0,
      (v: any) => (Array.isArray(v) ? v.slice(0, 8) : []));
  if (ai.is_multinational?.confianca === "alta" && ai.is_multinational.value === true && !org.is_multinational
      && !manual.includes("is_multinational")) {
    patch.is_multinational = true;
    applied.push("is_multinational");
  }

  patch.enriched_at = new Date().toISOString();
  if (!site && blank(org.website)) { /* nada a fazer */ }

  const { error: upErr } = await supabase.from("organizations").update(patch).eq("id", org.id);
  if (upErr) return { id: org.id, name: org.name, status: "error", error: upErr.message };

  return { id: org.id, name: org.name, status: applied.length ? "enriched" : "no_confident_data", fields: applied, scraped: markdown.length > 0 };
}

async function scrapeSite(site: string, name: string): Promise<string> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) return "";
  try {
    if (site) {
      const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: site, formats: ["markdown"], onlyMainContent: true }),
      });
      const data = await res.json();
      const md = data?.data?.markdown || data?.markdown || "";
      if (md && md.length > 80) return md;
    }
    const sres = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `"${name}" empresa site oficial`,
        limit: 2, lang: "pt-br", country: "br",
        scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
      }),
    });
    const sdata = await sres.json();
    return sdata?.data?.[0]?.markdown || "";
  } catch (e) {
    console.error("firecrawl error", e);
    return "";
  }
}

async function extractWithAI(input: { name: string; site: string; descricao: string; snippet: string }): Promise<AiOut | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return null;

  const systemPrompt = `Você é um analista de dados B2B. Extrai o cadastro de uma empresa a partir de evidências.

REGRA CENTRAL DE CONFIANÇA:
- "alta": a informação está explícita nas evidências fornecidas OU é fato notório e verificável sobre uma empresa amplamente conhecida.
- "media": inferência razoável, mas sem evidência direta.
- "baixa": chute.
NUNCA marque "alta" para adivinhações. Se não souber, devolva value=null e confianca="baixa".

Domínios permitidos:
- porte: micro | pequena | media | grande | enterprise
- faixa_funcionarios: 1-10 | 11-100 | 101-500 | 501-2000 | 2000+
- faixa_faturamento: ate_10M | 10M-100M | 100M-1B | 1B+
- maturidade_esg: 1 a 5 (1 = sem pauta ESG visível; 5 = liderança consolidada, relatórios e metas públicas)
- temas_interesse: termos curtos em português (ex.: economia circular, resíduos, logística reversa, descarbonização, embalagens, ESG)
- pais: nome do país sede da operação relevante (ex.: Brasil)`;

  const userPrompt = `Empresa: ${input.name}
Site: ${input.site || "(desconhecido)"}
Descrição já cadastrada: ${input.descricao || "(vazia)"}

Conteúdo do site (pode estar vazio):
${input.snippet || "(sem conteúdo)"}`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "cadastro_empresa",
            description: "Cadastro estruturado da empresa com confiança por campo.",
            parameters: {
              type: "object",
              properties: Object.fromEntries([
                ["setor", "string"], ["segmento", "string"], ["porte", "string"],
                ["faixa_funcionarios", "string"], ["faixa_faturamento", "string"],
                ["cidade", "string"], ["uf", "string"], ["pais", "string"],
                ["linkedin_url", "string"], ["descricao", "string"],
              ].map(([f]) => [f, {
                type: "object",
                properties: { value: { type: ["string", "null"] }, confianca: { type: "string", enum: ["alta", "media", "baixa"] } },
                required: ["value", "confianca"], additionalProperties: false,
              }]).concat([
                ["is_multinational", {
                  type: "object",
                  properties: { value: { type: ["boolean", "null"] }, confianca: { type: "string", enum: ["alta", "media", "baixa"] } },
                  required: ["value", "confianca"], additionalProperties: false,
                }],
                ["maturidade_esg", {
                  type: "object",
                  properties: { value: { type: ["number", "null"] }, confianca: { type: "string", enum: ["alta", "media", "baixa"] } },
                  required: ["value", "confianca"], additionalProperties: false,
                }],
                ["temas_interesse", {
                  type: "object",
                  properties: { value: { type: ["array", "null"], items: { type: "string" } }, confianca: { type: "string", enum: ["alta", "media", "baixa"] } },
                  required: ["value", "confianca"], additionalProperties: false,
                }],
              ] as any)),
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "cadastro_empresa" } },
      }),
    });

    const data = await res.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) { console.error("no tool call", JSON.stringify(data).slice(0, 500)); return null; }
    return JSON.parse(args) as AiOut;
  } catch (e) {
    console.error("ai error", e);
    return null;
  }
}

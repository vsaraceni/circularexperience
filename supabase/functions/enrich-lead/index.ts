import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GENERIC_DOMAINS = [
  "gmail.com", "googlemail.com", "hotmail.com", "outlook.com", "outlook.com.br",
  "yahoo.com", "yahoo.com.br", "live.com", "icloud.com", "aol.com",
  "protonmail.com", "zoho.com", "uol.com.br", "bol.com.br", "terra.com.br",
  "ig.com.br", "globo.com", "msn.com",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lead_id, user_id, force } = await req.json();
    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("email, company, cargo, colaboradores, company_description, company_website, suggested_tier, tier_confirmed")
      .eq("id", lead_id)
      .single();

    if (leadErr || !lead) {
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Skip test domains
    const emailLower = (lead.email || "").toLowerCase();
    if (emailLower.endsWith("@atinaedu.com.br") || emailLower.endsWith("@movimentocircular.io")) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "test_domain" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Idempotency: skip if already enriched (unless force=true)
    const alreadyEnriched = !!(lead.company_description && lead.suggested_tier);
    if (alreadyEnriched && !force) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "already_enriched" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const companyName = (lead.company || "").trim();
    const emailDomain = lead.email.split("@")[1]?.toLowerCase() || "";
    const isGeneric = GENERIC_DOMAINS.includes(emailDomain);
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");

    let website = "";
    let siteMarkdown = "";

    // Strategy 1: Search by company name via Firecrawl (most accurate)
    if (companyName && firecrawlKey) {
      try {
        console.log("Searching for company:", companyName);
        const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `"${companyName}" site oficial`,
            limit: 3,
            lang: "pt-br",
            country: "br",
            scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
          }),
        });

        const searchData = await searchRes.json();
        const results = searchData?.data || [];

        if (results.length > 0) {
          // Pick best result — prefer one whose URL/title matches company name
          const companyLower = companyName.toLowerCase();
          const best = results.find((r: any) =>
            (r.url || "").toLowerCase().includes(companyLower.replace(/\s+/g, "").slice(0, 8)) ||
            (r.title || "").toLowerCase().includes(companyLower)
          ) || results[0];

          website = best.url || "";
          siteMarkdown = best.markdown || "";
          console.log("Found via search:", website);
        }
      } catch (e) {
        console.error("Firecrawl search error:", e);
      }
    }

    // Strategy 2: Fallback to email domain scrape (if corporate)
    if (!siteMarkdown && !isGeneric && emailDomain && firecrawlKey) {
      const domainUrl = `https://${emailDomain}`;
      try {
        console.log("Fallback: scraping email domain:", domainUrl);
        const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: domainUrl,
            formats: ["markdown"],
            onlyMainContent: true,
          }),
        });

        const fcData = await fcRes.json();
        const markdown = fcData?.data?.markdown || fcData?.markdown || "";

        if (markdown && markdown.length > 50) {
          if (!website) website = domainUrl;
          siteMarkdown = markdown;
        }
      } catch (e) {
        console.error("Firecrawl scrape error:", e);
      }
    }

    // Generate description with AI
    let description = "";
    if (siteMarkdown) {
      description = await summarizeWithAI(companyName || emailDomain, siteMarkdown);
    } else {
      description = await summarizeWithAI(companyName || emailDomain, null);
    }

    // Suggest tier with AI based on declared headcount + enrichment context
    const tierResult = await suggestTier({
      companyName: companyName || emailDomain,
      cargo: (lead as any).cargo || "",
      colaboradoresDeclared: (lead as any).colaboradores || "",
      enrichedDescription: description,
      siteSnippet: siteMarkdown ? siteMarkdown.slice(0, 2000) : "",
    });

    // Save (preserve user-confirmed tier)
    const updatePayload: Record<string, unknown> = {
      company_website: website,
      company_description: description,
      last_activity_at: new Date().toISOString(),
    };
    if (tierResult) {
      updatePayload.suggested_tier = tierResult.suggested_tier;
      updatePayload.tier_reasoning = tierResult.reasoning;
      updatePayload.tier_signals = tierResult.signals;
    }
    await supabase.from("leads").update(updatePayload).eq("id", lead_id);

    await supabase.from("lead_activities").insert({
      lead_id,
      user_id: user_id || null,
      activity_type: "empresa_enriquecida",
      content: tierResult
        ? `Empresa enriquecida (Tier sugerido: ${tierResult.suggested_tier})`
        : `Empresa enriquecida: ${website || "sem site encontrado"}`,
      metadata: tierResult
        ? ({ suggested_tier: tierResult.suggested_tier, reasoning: tierResult.reasoning } as any)
        : null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        company_website: website,
        company_description: description,
        suggested_tier: tierResult?.suggested_tier ?? null,
        tier_reasoning: tierResult?.reasoning ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Enrich error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function summarizeWithAI(
  companyName: string,
  siteContent: string | null
): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    console.error("LOVABLE_API_KEY not set");
    return "";
  }

  const prompt = siteContent
    ? `Com base no conteúdo do site da empresa "${companyName}", escreva um resumo de 2-3 frases descrevendo o que a empresa faz, seu setor de atuação e porte aproximado. Seja objetivo e profissional. Responda em português.\n\nConteúdo do site:\n${siteContent.slice(0, 4000)}`
    : `Pesquise e descreva em 2-3 frases o que a empresa "${companyName}" faz, seu setor de atuação e porte aproximado. Se não conhecer a empresa, diga "Empresa não identificada automaticamente." Seja objetivo e profissional. Responda em português.`;

  try {
    const res = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Você é um assistente de pesquisa empresarial." },
            { role: "user", content: prompt },
          ],
          max_tokens: 300,
        }),
      }
    );

    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || "";
  } catch (e) {
    console.error("AI error:", e);
    return "";
  }
}

interface TierResult {
  suggested_tier: 1 | 2 | 3;
  reasoning: string;
  signals: {
    is_multinational: boolean;
    is_global_brand: boolean;
    estimated_global_revenue: "small" | "mid" | "large" | "enterprise" | "unknown";
    estimated_global_headcount: "<100" | "100-1000" | "1000-10000" | "10000+" | "unknown";
  };
}

async function suggestTier(input: {
  companyName: string;
  cargo: string;
  colaboradoresDeclared: string;
  enrichedDescription: string;
  siteSnippet: string;
}): Promise<TierResult | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    console.error("LOVABLE_API_KEY not set for tier suggestion");
    return null;
  }

  const systemPrompt = `Você é um analista B2B que classifica empresas em tiers para priorização de vendas.

REGRAS DE TIER:
- Tier 1 (alta prioridade): multinacional/global, marca reconhecida internacionalmente, faturamento estimado bilionário, ou 500+ colaboradores globais — MESMO se a operação no Brasil for pequena. Exemplo: subsidiária BR com 50 funcionários de uma multinacional bilionária = Tier 1.
- Tier 2 (média prioridade): empresa nacional média ou grande (~100-500 colaboradores), regional consolidada, ou marca brasileira reconhecida.
- Tier 3 (baixa prioridade): pequena empresa local, startup early-stage, microempresa, ou empresa não identificada com poucos sinais.

Use o número de colaboradores declarado pelo lead apenas como UMA das pistas. Se a descrição enriquecida indica que é uma multinacional/global brand, priorize esse sinal sobre o headcount declarado no Brasil.

Responda SEMPRE chamando a tool suggest_tier com JSON válido. reasoning em português, máximo 200 caracteres.`;

  const userPrompt = `Empresa: ${input.companyName || "(desconhecida)"}
Cargo do lead: ${input.cargo || "(não informado)"}
Colaboradores declarados pelo lead: ${input.colaboradoresDeclared || "(não informado)"}

Descrição enriquecida:
${input.enrichedDescription || "(sem descrição)"}

${input.siteSnippet ? `Trecho do site oficial:\n${input.siteSnippet}` : ""}`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_tier",
              description: "Retorna a classificação de tier sugerida para a empresa.",
              parameters: {
                type: "object",
                properties: {
                  suggested_tier: { type: "integer", enum: [1, 2, 3] },
                  reasoning: { type: "string" },
                  signals: {
                    type: "object",
                    properties: {
                      is_multinational: { type: "boolean" },
                      is_global_brand: { type: "boolean" },
                      estimated_global_revenue: {
                        type: "string",
                        enum: ["small", "mid", "large", "enterprise", "unknown"],
                      },
                      estimated_global_headcount: {
                        type: "string",
                        enum: ["<100", "100-1000", "1000-10000", "10000+", "unknown"],
                      },
                    },
                    required: [
                      "is_multinational",
                      "is_global_brand",
                      "estimated_global_revenue",
                      "estimated_global_headcount",
                    ],
                    additionalProperties: false,
                  },
                },
                required: ["suggested_tier", "reasoning", "signals"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_tier" } },
        max_tokens: 400,
      }),
    });

    if (!res.ok) {
      console.error("Tier AI error status:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    if (!args) return null;
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    if (!parsed?.suggested_tier || ![1, 2, 3].includes(parsed.suggested_tier)) return null;
    return parsed as TierResult;
  } catch (e) {
    console.error("suggestTier error:", e);
    return null;
  }
}

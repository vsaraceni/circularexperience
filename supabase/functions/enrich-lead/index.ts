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
    const { lead_id, user_id } = await req.json();
    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch lead
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("email, company")
      .eq("id", lead_id)
      .single();

    if (leadErr || !lead) {
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailDomain = lead.email.split("@")[1]?.toLowerCase() || "";
    const isGeneric = GENERIC_DOMAINS.includes(emailDomain);
    const website = isGeneric ? "" : `https://${emailDomain}`;

    let description = "";

    // Try Firecrawl if corporate domain
    if (!isGeneric && website) {
      const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
      if (firecrawlKey) {
        try {
          console.log("Scraping with Firecrawl:", website);
          const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${firecrawlKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: website,
              formats: ["markdown"],
              onlyMainContent: true,
            }),
          });

          const fcData = await fcRes.json();
          const markdown = fcData?.data?.markdown || fcData?.markdown || "";

          if (markdown && markdown.length > 50) {
            // Use AI to summarize
            description = await summarizeWithAI(
              lead.company || emailDomain,
              markdown
            );
          }
        } catch (e) {
          console.error("Firecrawl error:", e);
        }
      }
    }

    // Fallback: AI only with company name
    if (!description) {
      description = await summarizeWithAI(
        lead.company || emailDomain,
        null
      );
    }

    // Save to lead
    await supabase
      .from("leads")
      .update({
        company_website: website,
        company_description: description,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", lead_id);

    // Log activity
    await supabase.from("lead_activities").insert({
      lead_id,
      user_id: user_id || null,
      activity_type: "empresa_enriquecida",
      content: `Empresa enriquecida: ${website || "sem site corporativo"}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        company_website: website,
        company_description: description,
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

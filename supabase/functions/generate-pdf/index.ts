import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_HOST_SUFFIXES = [
  ".lovable.app",
  ".lovableproject.com",
  ".lovable.dev",
];
const ALLOWED_HOSTS = [
  "crm.movimentocircular.io",
  "experience.movimentocircular.io",
  "circularexperience.lovable.app",
];
const FALLBACK_ORIGIN = "https://circularexperience.lovable.app";

function isAllowedOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:") return false;
    if (ALLOWED_HOSTS.includes(u.hostname)) return true;
    return ALLOWED_HOST_SUFFIXES.some((s) => u.hostname.endsWith(s));
  } catch {
    return false;
  }
}

function resolveRenderOrigin(bodyOrigin: unknown, headerOrigin: string | null): string {
  const candidates = [
    typeof bodyOrigin === "string" ? bodyOrigin : null,
    headerOrigin,
  ].filter(Boolean) as string[];
  for (const c of candidates) {
    if (isAllowedOrigin(c)) return c.replace(/\/$/, "");
  }
  return FALLBACK_ORIGIN;
}

async function renderViaBrowserless(printUrl: string, apiKey: string, fast: boolean) {
  const res = await fetch(`https://production-sfo.browserless.io/pdf?token=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
    body: JSON.stringify({
      url: printUrl,
      gotoOptions: { waitUntil: "networkidle2", timeout: 30000 },
      viewport: { width: 1920, height: 1080 },
      options: {
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      },
      waitForFunction: { fn: "() => window.__SLIDES_READY === true", timeout: fast ? 8000 : 15000 },
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Browserless ${res.status}: ${txt}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { slug, renderOrigin } = body ?? {};
    if (!slug) {
      return new Response(JSON.stringify({ error: "slug is required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const origin = resolveRenderOrigin(renderOrigin, req.headers.get("origin"));
    console.log(`[generate-pdf] resolved renderOrigin=${origin} (body=${renderOrigin ?? "null"}, header=${req.headers.get("origin") ?? "null"})`);

    const browserlessApiKey = Deno.env.get("BROWSERLESS_API_KEY");
    if (!browserlessApiKey) throw new Error("BROWSERLESS_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // 1. Resolve proposal + master
    const { data: proposal, error: pErr } = await admin
      .from("proposals")
      .select("id, slug, product_id, master_asset_id")
      .eq("slug", slug)
      .maybeSingle();
    if (pErr || !proposal) throw new Error("Proposal not found");

    let masterId: string | null = proposal.master_asset_id ?? null;

    // Cascade: explicit master -> product's active master
    if (!masterId && proposal.product_id) {
      const { data: activeMaster } = await admin
        .from("proposal_master_assets")
        .select("id")
        .eq("product_id", proposal.product_id)
        .eq("is_active", true)
        .maybeSingle();
      masterId = activeMaster?.id ?? null;
    }

    // No master resolved — fail loudly, never fall back to landing render
    if (!masterId) {
      return new Response(
        JSON.stringify({
          error:
            "Proposta sem PDF mestre. Associe um produto com PDF mestre ativo antes de gerar o PDF.",
        }),
        {
          status: 422,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // NEW MODE: master + dynamic slide
    console.log(`[generate-pdf] MASTER+SLIDE mode for slug=${slug}, masterId=${masterId}`);

    const { data: master, error: mErr } = await admin
      .from("proposal_master_assets")
      .select("storage_path")
      .eq("id", masterId)
      .single();
    if (mErr || !master) throw new Error("Master asset not found");

    // Download master from storage
    const { data: masterFile, error: dlErr } = await admin.storage
      .from("proposal-masters")
      .download(master.storage_path);
    if (dlErr || !masterFile) throw new Error(`Failed to download master: ${dlErr?.message}`);
    const masterBuffer = new Uint8Array(await masterFile.arrayBuffer());

    // Render dynamic proposal slide via Browserless
    const slidePrintUrl = `${origin}/apresentacao-print/${slug}`;
    console.log(`[generate-pdf] slidePrintUrl=${slidePrintUrl}`);
    const slideBuffer = await renderViaBrowserless(slidePrintUrl, browserlessApiKey, true);

    // Merge with pdf-lib
    const out = await PDFDocument.create();
    const [masterDoc, slideDoc] = await Promise.all([
      PDFDocument.load(masterBuffer),
      PDFDocument.load(slideBuffer),
    ]);
    const masterPages = await out.copyPages(masterDoc, masterDoc.getPageIndices());
    masterPages.forEach((p) => out.addPage(p));
    const slidePages = await out.copyPages(slideDoc, slideDoc.getPageIndices());
    slidePages.forEach((p) => out.addPage(p));

    const finalPdf = await out.save();

    return new Response(finalPdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="proposta-${slug}.pdf"`,
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    console.error("[generate-pdf] error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

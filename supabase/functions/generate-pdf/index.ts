import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slug } = await req.json();
    if (!slug) {
      return new Response(JSON.stringify({ error: "slug is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const browserlessApiKey = Deno.env.get("BROWSERLESS_API_KEY");
    if (!browserlessApiKey) {
      throw new Error("BROWSERLESS_API_KEY not configured");
    }

    const siteUrl = "https://circularexperience.lovable.app";
    const printUrl = `${siteUrl}/apresentacao-print/${slug}`;

    console.log(`Generating PDF for: ${printUrl}`);

    const browserlessResponse = await fetch(
      `https://production-sfo.browserless.io/pdf?token=${browserlessApiKey}`,
      {
        method: "POST",
        headers: {
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: printUrl,
          gotoOptions: {
            waitUntil: "networkidle2",
            timeout: 30000,
          },
          viewport: {
            width: 1920,
            height: 1080,
          },
          options: {
            printBackground: true,
            preferCSSPageSize: true,
            margin: {
              top: "0",
              right: "0",
              bottom: "0",
              left: "0",
            },
          },
          waitForFunction: {
            fn: "() => window.__SLIDES_READY === true",
            timeout: 15000,
          },
        }),
      }
    );

    if (!browserlessResponse.ok) {
      const errorText = await browserlessResponse.text();
      console.error("Browserless error:", errorText);
      throw new Error(`Browserless returned ${browserlessResponse.status}: ${errorText}`);
    }

    const pdfBuffer = await browserlessResponse.arrayBuffer();

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="proposta-${slug}.pdf"`,
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    console.error("PDF generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

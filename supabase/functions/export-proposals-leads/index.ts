import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-export-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Validate export token
  const token = req.headers.get("x-export-token");
  const expectedToken = Deno.env.get("PROPOSALS_EXPORT_TOKEN");

  if (!expectedToken || token !== expectedToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Parse query params
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "1000"), 5000);
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const format = url.searchParams.get("format") || "json";

  // Use service_role key to bypass RLS
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase
    .from("vw_proposals_leads")
    .select("*")
    .range(offset, offset + limit - 1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (format === "csv") {
    if (!data || data.length === 0) {
      return new Response("", {
        headers: { ...corsHeaders, "Content-Type": "text/csv" },
      });
    }
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row: Record<string, unknown>) =>
        headers.map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        }).join(",")
      ),
    ];
    return new Response(csvRows.join("\n"), {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=propostas_leads.csv",
      },
    });
  }

  return new Response(JSON.stringify({ data, count: data?.length || 0 }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

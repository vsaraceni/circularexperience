import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PIXEL_ID = "1614314956387976";
const GRAPH_URL = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events`;

const STAGE_MAP: Record<string, { event_name: string; value: number }> = {
  call_agendada: { event_name: "Schedule", value: 0 },
  fechado: { event_name: "Purchase", value: 14900 },
};

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input.toLowerCase().trim());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { lead_id, email, work_email, telefone, fb_lead_id, stage } = await req.json();

    if (!lead_id || !email || !stage) {
      return new Response(
        JSON.stringify({ error: "lead_id, email and stage are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mapping = STAGE_MAP[stage];
    if (!mapping) {
      return new Response(
        JSON.stringify({ skipped: true, reason: `Stage "${stage}" not tracked` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash PII
    const emHashes = [await sha256(email)];
    if (work_email) emHashes.push(await sha256(work_email));

    const phHashes: string[] = [];
    if (telefone) {
      const digits = telefone.replace(/\D/g, "");
      if (digits) phHashes.push(await sha256(digits));
    }

    const userData: Record<string, unknown> = { em: emHashes };
    if (phHashes.length) userData.ph = phHashes;
    if (fb_lead_id) userData.lead_id = fb_lead_id;

    const accessToken = Deno.env.get("META_ACCESS_TOKEN");
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "META_ACCESS_TOKEN not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = {
      access_token: accessToken,
      data: [
        {
          action_source: "system_generated",
          event_name: mapping.event_name,
          event_time: Math.floor(Date.now() / 1000),
          user_data: userData,
          custom_data: {
            event_source: "crm",
            lead_event_source: "Movimento Circular CRM",
            lead_stage: stage,
            currency: "BRL",
            value: mapping.value,
          },
        },
      ],
    };

    const metaRes = await fetch(GRAPH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const metaBody = await metaRes.text();
    console.log("Meta status:", metaRes.status);
    console.log("Meta body:", metaBody);

    let metaResult: unknown;
    try { metaResult = JSON.parse(metaBody); } catch { metaResult = metaBody; }

    // Update lead with meta tracking info (only on success)
    if (metaRes.ok) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceKey);

      await supabase
        .from("leads")
        .update({
          meta_last_event_sent: mapping.event_name,
          meta_last_event_at: new Date().toISOString(),
        })
        .eq("id", lead_id);
    }

    return new Response(
      JSON.stringify({
        success: metaRes.ok,
        meta_status: metaRes.status,
        meta_body: metaResult,
        event_name: mapping.event_name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-meta-capi-event error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

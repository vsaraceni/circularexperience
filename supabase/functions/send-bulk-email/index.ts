import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the caller is admin
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate input
    const body = await req.json();
    const { lead_ids, subject, body_html } = body;

    if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
      return new Response(JSON.stringify({ error: "lead_ids required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (lead_ids.length > 50) {
      return new Response(JSON.stringify({ error: "Max 50 leads per batch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!subject || typeof subject !== "string" || subject.length > 200) {
      return new Response(JSON.stringify({ error: "Invalid subject" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!body_html || typeof body_html !== "string") {
      return new Response(JSON.stringify({ error: "Invalid body_html" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch leads
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("id, name, email, company")
      .in("id", lead_ids);

    if (leadsError || !leads) {
      return new Response(JSON.stringify({ error: "Failed to fetch leads" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch suppressed emails
    const { data: suppressed } = await supabase
      .from("suppressed_emails")
      .select("email");
    const suppressedSet = new Set((suppressed || []).map((s: any) => s.email.toLowerCase()));

    // Get sender info from email_templates (welcome slug)
    const { data: tpl } = await supabase
      .from("email_templates")
      .select("from_email, from_name")
      .eq("slug", "welcome")
      .maybeSingle();

    const fromEmail = tpl?.from_email || "contato@notify.crm.movimentocircular.io";
    const fromName = tpl?.from_name || "Circular Experience";

    let sent = 0;
    let failed = 0;
    let suppressedCount = 0;
    const errors: string[] = [];

    for (const lead of leads) {
      // Check suppression
      if (suppressedSet.has(lead.email.toLowerCase())) {
        suppressedCount++;
        continue;
      }

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [lead.email],
            subject,
            html: body_html,
          }),
        });

        if (res.ok) {
          sent++;

          // Log activity
          await supabase.from("lead_activities").insert({
            lead_id: lead.id,
            user_id: user.id,
            activity_type: "email_massa_enviado",
            content: `Email em massa: ${subject}`,
            metadata: { subject, sent_at: new Date().toISOString() },
          });
        } else {
          const errBody = await res.text();
          failed++;
          errors.push(`${lead.email}: ${res.status} ${errBody.slice(0, 100)}`);
        }
      } catch (err: any) {
        failed++;
        errors.push(`${lead.email}: ${err.message}`);
      }

      // Rate limit: 500ms between sends
      if (leads.indexOf(lead) < leads.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return new Response(
      JSON.stringify({ sent, failed, suppressed: suppressedCount, errors: errors.slice(0, 10) }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("send-bulk-email error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

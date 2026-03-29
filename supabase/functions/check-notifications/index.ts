import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const today = new Date().toISOString().split("T")[0];
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStr = threeDaysFromNow.toISOString().split("T")[0];

    const notifications: { user_id: string; type: string; title: string; body: string; lead_id: string }[] = [];

    // 1. Follow-ups due today or overdue
    const { data: dueFollowUps } = await supabase
      .from("lead_follow_ups")
      .select("id, lead_id, due_date, note")
      .eq("completed", false)
      .lte("due_date", today);

    if (dueFollowUps && dueFollowUps.length > 0) {
      // Get leads to find assigned_to
      const leadIds = [...new Set(dueFollowUps.map((f: any) => f.lead_id))];
      const { data: leads } = await supabase
        .from("leads")
        .select("id, assigned_to, company, name")
        .in("id", leadIds);

      const leadMap = new Map((leads || []).map((l: any) => [l.id, l]));

      for (const f of dueFollowUps) {
        const lead = leadMap.get(f.lead_id);
        if (!lead?.assigned_to) continue;

        const isOverdue = f.due_date < today;
        const title = isOverdue
          ? `Follow-up atrasado: ${lead.company || lead.name}`
          : `Follow-up hoje: ${lead.company || lead.name}`;

        // Check if already notified today
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", lead.assigned_to)
          .eq("type", "follow_up_due")
          .eq("lead_id", f.lead_id)
          .gte("created_at", today + "T00:00:00Z")
          .limit(1);

        if (!existing || existing.length === 0) {
          notifications.push({
            user_id: lead.assigned_to,
            type: "follow_up_due",
            title,
            body: f.note || "",
            lead_id: f.lead_id,
          });
        }
      }
    }

    // 2. Proposals expiring within 3 days
    const { data: expiringProposals } = await supabase
      .from("proposals")
      .select("id, lead_id, company_name, valid_until, created_by")
      .gte("valid_until", today)
      .lte("valid_until", threeDaysStr)
      .eq("status", "enviada");

    if (expiringProposals) {
      for (const p of expiringProposals) {
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", p.created_by)
          .eq("type", "proposal_expiring")
          .eq("lead_id", p.lead_id || "")
          .gte("created_at", today + "T00:00:00Z")
          .limit(1);

        if (!existing || existing.length === 0) {
          notifications.push({
            user_id: p.created_by,
            type: "proposal_expiring",
            title: `Proposta expirando: ${p.company_name}`,
            body: `Validade até ${p.valid_until}`,
            lead_id: p.lead_id || "",
          });
        }
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) {
        console.error("Error inserting notifications:", error);
      }
    }

    return new Response(
      JSON.stringify({ success: true, created: notifications.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

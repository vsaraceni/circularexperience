import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SLA config mirrored from frontend UrgencyBadge
const SLA_CONFIG: Record<string, { criticalH?: number; criticalD?: number; useHours?: boolean }> = {
  novo: { criticalH: 4, useHours: true },
  boas_vindas: { criticalH: 6, useHours: true },
  em_contato: { criticalD: 4 },
  call_agendada: { criticalD: 10 },
  proposta: { criticalD: 4 },
  nutricao: { criticalD: 10 },
};

async function sendEmailViaResend(to: string, subject: string, htmlBody: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey || !to) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: "Circular Experience <contato@lovable.movimentocircular.io>",
        to: [to],
        subject,
        html: htmlBody,
      }),
    });
  } catch (e) {
    console.error("Resend error:", e);
  }
}

function buildEmailHtml(title: string, body: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
      <h2 style="color:#2FB2C0;margin-bottom:12px;">${title}</h2>
      <p style="color:#333;font-size:14px;line-height:1.6;">${body}</p>
      <hr style="margin:24px 0;border:none;border-top:1px solid #eee;">
      <p style="font-size:12px;color:#999;">Circular Experience CRM</p>
    </div>`;
}

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

    // Get all admin user IDs
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    const adminIds = (adminRoles || []).map((r: any) => r.user_id);

    // Get admin profiles for email
    const { data: adminProfiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", adminIds);
    const profileMap = new Map((adminProfiles || []).map((p: any) => [p.id, p.email]));

    // 1. Follow-ups due today or overdue
    const { data: dueFollowUps } = await supabase
      .from("lead_follow_ups")
      .select("id, lead_id, due_date, note")
      .eq("completed", false)
      .lte("due_date", today);

    if (dueFollowUps && dueFollowUps.length > 0) {
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

    // 3. SLA breach check — leads exceeding critical SLA time
    const { data: activeLeads } = await supabase
      .from("leads")
      .select("id, name, company, kanban_stage, stage_updated_at, last_activity_at, assigned_to")
      .not("kanban_stage", "in", "(fechado,perdido)");

    if (activeLeads) {
      const now = new Date();
      for (const lead of activeLeads) {
        const config = SLA_CONFIG[lead.kanban_stage];
        if (!config) continue;

        const refDate = lead.kanban_stage === "nutricao"
          ? (lead.last_activity_at || lead.stage_updated_at)
          : lead.stage_updated_at;
        if (!refDate) continue;

        const ref = new Date(refDate);
        let isBreach = false;

        if (config.useHours) {
          const hours = (now.getTime() - ref.getTime()) / (1000 * 60 * 60);
          isBreach = hours >= (config.criticalH ?? Infinity);
        } else {
          const days = (now.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24);
          isBreach = days >= (config.criticalD ?? Infinity);
        }

        if (!isBreach) continue;

        const targetUserId = lead.assigned_to || adminIds[0];
        if (!targetUserId) continue;

        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", targetUserId)
          .eq("type", "sla_breach")
          .eq("lead_id", lead.id)
          .gte("created_at", today + "T00:00:00Z")
          .limit(1);

        if (!existing || existing.length === 0) {
          notifications.push({
            user_id: targetUserId,
            type: "sla_breach",
            title: `SLA crítico: ${lead.company || lead.name}`,
            body: `Lead parado em "${lead.kanban_stage}" além do limite`,
            lead_id: lead.id,
          });
        }
      }
    }

    // 4. New leads without action (> 30min in "novo" stage)
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: staleNewLeads } = await supabase
      .from("leads")
      .select("id, name, company, email")
      .eq("kanban_stage", "novo")
      .lt("created_at", thirtyMinAgo);

    if (staleNewLeads) {
      for (const lead of staleNewLeads) {
        for (const adminId of adminIds) {
          const { data: existing } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", adminId)
            .eq("type", "new_lead_stale")
            .eq("lead_id", lead.id)
            .gte("created_at", today + "T00:00:00Z")
            .limit(1);

          if (!existing || existing.length === 0) {
            notifications.push({
              user_id: adminId,
              type: "new_lead_stale",
              title: `Lead sem ação: ${lead.company || lead.name}`,
              body: `Novo lead aguardando há mais de 30min`,
              lead_id: lead.id,
            });
          }
        }
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) {
        console.error("Error inserting notifications:", error);
      }

      // Send emails for each notification
      for (const n of notifications) {
        const email = profileMap.get(n.user_id);
        if (email) {
          await sendEmailViaResend(email, n.title, buildEmailHtml(n.title, n.body));
        }
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

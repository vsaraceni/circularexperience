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

const STAGE_LABELS: Record<string, string> = {
  novo: "Novo",
  boas_vindas: "Boas-Vindas",
  em_contato: "Em Contato",
  call_agendada: "Call Agendada",
  proposta: "Proposta",
  nutricao: "Nutrição",
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

interface DigestSection {
  emoji: string;
  title: string;
  items: { name: string; detail: string; leadId: string }[];
}

function buildDigestEmailHtml(sections: DigestSection[]): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const sectionHtml = sections
    .filter(s => s.items.length > 0)
    .map(s => `
      <div style="margin-bottom:24px;">
        <h3 style="color:#5F2558;font-size:16px;margin-bottom:8px;">${s.emoji} ${s.title} (${s.items.length})</h3>
        <table style="width:100%;border-collapse:collapse;">
          ${s.items.map(item => `
            <tr style="border-bottom:1px solid #f0ecea;">
              <td style="padding:8px 0;font-size:13px;color:#333;">${item.name}</td>
              <td style="padding:8px 0;font-size:12px;color:#666;text-align:right;">${item.detail}</td>
            </tr>
          `).join("")}
        </table>
      </div>
    `).join("");

  if (!sectionHtml) {
    return `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;">
        <h2 style="color:#2FB2C0;margin-bottom:4px;">☀️ Bom dia!</h2>
        <p style="color:#666;font-size:13px;margin-bottom:24px;">${dateStr}</p>
        <p style="color:#333;font-size:14px;">Nenhuma pendência para hoje. Tudo em dia! 🎉</p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #f0ecea;">
        <p style="font-size:11px;color:#999;">Circular Experience CRM</p>
      </div>`;
  }

  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;">
      <h2 style="color:#2FB2C0;margin-bottom:4px;">☀️ Bom dia! Seu resumo do dia</h2>
      <p style="color:#666;font-size:13px;margin-bottom:24px;">${dateStr}</p>
      ${sectionHtml}
      <hr style="margin:24px 0;border:none;border-top:1px solid #f0ecea;">
      <p style="font-size:11px;color:#999;">Circular Experience CRM — Resumo matinal automático</p>
    </div>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse mode from body
    let mode = "realtime";
    try {
      const body = await req.json();
      if (body?.mode === "digest") mode = "digest";
    } catch { /* no body = realtime */ }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const today = new Date().toISOString().split("T")[0];
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStr = threeDaysFromNow.toISOString().split("T")[0];

    const notifications: { user_id: string; type: string; title: string; body: string; lead_id: string }[] = [];

    // Digest mode collects items per section for consolidated email
    const digestSections: Record<string, DigestSection> = {
      sla: { emoji: "🔴", title: "SLA Crítico", items: [] },
      follow_up: { emoji: "📅", title: "Follow-ups Pendentes", items: [] },
      stale: { emoji: "⏳", title: "Leads Sem Ação", items: [] },
      proposal: { emoji: "📄", title: "Propostas Expirando", items: [] },
    };

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

          digestSections.follow_up.items.push({
            name: lead.company || lead.name,
            detail: isOverdue ? `Atrasado (${f.due_date})` : "Hoje",
            leadId: f.lead_id,
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

          digestSections.proposal.items.push({
            name: p.company_name,
            detail: `Expira ${p.valid_until}`,
            leadId: p.lead_id || "",
          });
        }
      }
    }

    // 3. SLA breach check
    const { data: pendingFollowUps } = await supabase
      .from("lead_follow_ups")
      .select("lead_id, due_date")
      .eq("completed", false)
      .gte("due_date", today);

    const leadsWithPendingFU = new Set(
      (pendingFollowUps || []).map((f: any) => f.lead_id)
    );

    const { data: activeLeads } = await supabase
      .from("leads")
      .select("id, name, company, kanban_stage, stage_updated_at, last_activity_at, assigned_to")
      .not("kanban_stage", "in", "(fechado,perdido)");

    if (activeLeads) {
      const now = new Date();
      for (const lead of activeLeads) {
        if (leadsWithPendingFU.has(lead.id)) continue;

        const config = SLA_CONFIG[lead.kanban_stage];
        if (!config) continue;

        const refDate = lead.last_activity_at || lead.stage_updated_at;
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
            body: `Lead parado em "${STAGE_LABELS[lead.kanban_stage] || lead.kanban_stage}" além do limite`,
            lead_id: lead.id,
          });

          digestSections.sla.items.push({
            name: lead.company || lead.name,
            detail: STAGE_LABELS[lead.kanban_stage] || lead.kanban_stage,
            leadId: lead.id,
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

            digestSections.stale.items.push({
              name: lead.company || lead.name,
              detail: "Aguardando ação",
              leadId: lead.id,
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
    }

    // Email logic depends on mode
    if (mode === "digest") {
      // Send ONE consolidated email per admin
      for (const adminId of adminIds) {
        const email = profileMap.get(adminId);
        if (!email) continue;

        const adminNotifs = notifications.filter(n => n.user_id === adminId);
        // Build sections filtered for this admin
        const adminSections: DigestSection[] = Object.values(digestSections).map(s => ({
          ...s,
          items: s.items, // all items go to all admins in digest
        }));

        const html = buildDigestEmailHtml(adminSections);
        const totalItems = adminSections.reduce((sum, s) => sum + s.items.length, 0);
        const subject = totalItems > 0
          ? `☀️ Resumo do dia — ${totalItems} pendência${totalItems > 1 ? "s" : ""}`
          : "☀️ Bom dia — Tudo em dia!";

        await sendEmailViaResend(email, subject, html);
      }
    }
    // In "realtime" mode: NO emails sent (notifications are in-app + push only)

    return new Response(
      JSON.stringify({ success: true, mode, created: notifications.length }),
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

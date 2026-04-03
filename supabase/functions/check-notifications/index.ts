import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let mode = "realtime";
    try {
      const body = await req.json();
      if (body?.mode === "digest") mode = "digest";
      if (body?.mode === "daily-performance") mode = "daily-performance";
    } catch { /* no body = realtime */ }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

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

    // Get all active leads
    const { data: activeLeads } = await supabase
      .from("leads")
      .select("id, name, company, kanban_stage, stage_updated_at, last_activity_at, assigned_to, call_date, briefing_notes")
      .not("kanban_stage", "in", "(fechado,perdido)");

    const leads = activeLeads || [];

    // Get follow-ups for active leads
    const leadIds = leads.map((l: any) => l.id);
    const { data: followUps } = await supabase
      .from("lead_follow_ups")
      .select("lead_id, due_date, completed")
      .in("lead_id", leadIds);

    // Build follow-up map
    const followUpsByLead: Record<string, { hasToday: boolean; hasOverdue: boolean; hasFuture: boolean }> = {};
    for (const fu of (followUps || [])) {
      if (fu.completed) continue;
      if (!followUpsByLead[fu.lead_id]) {
        followUpsByLead[fu.lead_id] = { hasToday: false, hasOverdue: false, hasFuture: false };
      }
      if (fu.due_date < today) followUpsByLead[fu.lead_id].hasOverdue = true;
      else if (fu.due_date === today) followUpsByLead[fu.lead_id].hasToday = true;
      else followUpsByLead[fu.lead_id].hasFuture = true;
    }

    // SLA config for urgency check
    const SLA_CONFIG: Record<string, { criticalH?: number; criticalD?: number; useHours?: boolean }> = {
      novo: { criticalH: 4, useHours: true },
      boas_vindas: { criticalH: 6, useHours: true },
      em_contato: { criticalD: 4 },
      call_agendada: { criticalD: 10 },
      proposta: { criticalD: 4 },
      nutricao: { criticalD: 10 },
    };

    function getUrgencyLevel(stage: string, stageUpdatedAt: string | null, lastActivityAt: string | null): string {
      const config = SLA_CONFIG[stage];
      if (!config) return "normal";
      const refDate = lastActivityAt || stageUpdatedAt;
      if (!refDate) return "normal";
      const ref = new Date(refDate);
      if (config.useHours) {
        const hours = (now.getTime() - ref.getTime()) / (1000 * 60 * 60);
        if (hours >= (config.criticalH ?? Infinity)) return "critical";
      } else {
        const days = (now.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24);
        if (days >= (config.criticalD ?? Infinity)) return "critical";
      }
      return "normal";
    }

    function hasPendingFU(fu?: { hasToday: boolean; hasOverdue: boolean; hasFuture: boolean }): boolean {
      if (!fu) return false;
      return (fu.hasToday || fu.hasFuture) && !fu.hasOverdue;
    }

    // Calculate the 5 missions (same logic as MissionsBanner.tsx)
    const novosCount = leads.filter((l: any) => l.kanban_stage === "novo").length;

    const boasVindasCount = leads.filter((l: any) =>
      l.kanban_stage === "boas_vindas" &&
      !hasPendingFU(followUpsByLead[l.id]) &&
      getUrgencyLevel(l.kanban_stage, l.stage_updated_at, l.last_activity_at) !== "normal"
    ).length;

    const emContatoCount = leads.filter((l: any) => l.kanban_stage === "em_contato").length;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayStr = now.toISOString().split("T")[0];
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const callsCount = leads.filter((l: any) => {
      if (l.kanban_stage !== "call_agendada" || !l.call_date) return false;
      const d = l.call_date.split("T")[0];
      return d === todayStr || d === tomorrowStr;
    }).length;

    const briefingsCount = leads.filter((l: any) =>
      (l.kanban_stage === "call_agendada" || l.kanban_stage === "proposta") &&
      (!l.briefing_notes || l.briefing_notes.trim() === "")
    ).length;

    const getColor = (count: number, noYellow = false) =>
      count === 0 ? "#2FB2C0" : (noYellow ? "#F4A736" : (count >= 3 ? "#EB626D" : "#F4A736"));

    const missions = [
      { label: "Novos", count: novosCount, color: getColor(novosCount) },
      { label: "Follow-up", count: boasVindasCount, color: getColor(boasVindasCount) },
      { label: "Agendamento", count: emContatoCount, color: getColor(emContatoCount) },
      { label: "Calls", count: callsCount, color: callsCount === 0 ? "#2FB2C0" : "#F4A736" },
      { label: "Briefing", count: briefingsCount, color: getColor(briefingsCount) },
    ];

    const resolvedCount = missions.filter(m => m.count === 0).length;
    const totalMissions = missions.length;
    const allResolved = resolvedCount === totalMissions;

    // Notifications (in-app) — keep existing logic for realtime
    const notifications: any[] = [];

    // SLA breach notifications for realtime
    if (mode === "realtime") {
      for (const lead of leads) {
        if (lead.kanban_stage === "novo") {
          const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
          // Skip if lead was created less than 30min ago (we don't have created_at selected, use stage_updated_at)
        }
        // Keep SLA breach notifications for in-app
        const urgency = getUrgencyLevel(lead.kanban_stage, lead.stage_updated_at, lead.last_activity_at);
        if (urgency === "critical" && !hasPendingFU(followUpsByLead[lead.id])) {
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
              body: `Lead parado em estágio além do limite`,
              lead_id: lead.id,
            });
          }
        }
      }

      // Follow-ups due today/overdue
      const { data: dueFollowUps } = await supabase
        .from("lead_follow_ups")
        .select("id, lead_id, due_date, note")
        .eq("completed", false)
        .lte("due_date", today);

      if (dueFollowUps && dueFollowUps.length > 0) {
        const fuLeadIds = [...new Set(dueFollowUps.map((f: any) => f.lead_id))];
        const { data: fuLeads } = await supabase
          .from("leads")
          .select("id, assigned_to, company, name")
          .in("id", fuLeadIds);
        const leadMap = new Map((fuLeads || []).map((l: any) => [l.id, l]));

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
    }

    // Insert in-app notifications
    if (notifications.length > 0) {
      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) console.error("Error inserting notifications:", error);
    }

    // Digest mode: send email via transactional email system
    if (mode === "digest") {
      const dateStr = now.toLocaleDateString("pt-BR", {
        weekday: "long", day: "numeric", month: "long",
        timeZone: "America/Sao_Paulo",
      });

      for (const adminId of adminIds) {
        const email = profileMap.get(adminId);
        if (!email) continue;

        const idempotencyKey = `daily-digest-${adminId}-${todayStr}`;

        try {
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "daily-digest",
              recipientEmail: email,
              idempotencyKey,
              templateData: {
                missions,
                resolvedCount,
                totalMissions,
                allResolved,
                dateStr,
              },
            },
          });
          console.log(`Digest sent to ${email}`);
        } catch (e) {
          console.error(`Error sending digest to ${email}:`, e);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, mode, created: notifications.length, missions }),
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

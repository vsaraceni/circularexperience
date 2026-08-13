import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WelcomeData {
  lead_id: string;
  name: string;
  email: string;
  company: string;
  cargo: string;
  sender_name?: string;
  sender_email?: string;
  sender_phone?: string;
  /** Quando presente, usa a versão pessoal do e-mail desse usuário (se existir). */
  sender_user_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY não configurada");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const data: WelcomeData = await req.json();

    if (!data.email || !data.name) {
      throw new Error("email and name are required");
    }

    // Institutional defaults (used when no SDR-specific sender is provided,
    // i.e. the automatic welcome triggered on lead INSERT).
    const DEFAULT_SENDER_NAME = "Lívia Lins";
    const DEFAULT_SENDER_EMAIL = "contato@movimentocircular.io";
    const DEFAULT_SENDER_PHONE = "+55 11 98244-1551";
    const isAutomatic = !data.sender_email;
    const senderName = data.sender_name || DEFAULT_SENDER_NAME;
    const senderEmail = data.sender_email || DEFAULT_SENDER_EMAIL;
    const senderPhone = data.sender_phone || DEFAULT_SENDER_PHONE;

    // Idempotency guard: skip if already sent
    if (data.lead_id) {
      const { data: existing } = await supabaseAdmin
        .from("leads")
        .select("welcome_sent, kanban_stage")
        .eq("id", data.lead_id)
        .maybeSingle();
      if (existing?.welcome_sent) {
        return new Response(
          JSON.stringify({ success: true, skipped: "already_sent" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Fetch template
    const { data: template } = await supabaseAdmin
      .from("email_templates")
      .select("subject, body_html, from_name, from_email, reply_to")
      .eq("slug", "lead-welcome")
      .single();

    if (!template) {
      console.warn("No lead-welcome template found, skipping");
      return new Response(
        JSON.stringify({ success: false, error: "Template not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Personalização individual: só no envio manual, quando o remetente é conhecido.
    let subjectSource = template.subject;
    let bodySource = template.body_html;
    if (data.sender_user_id) {
      const { data: ownTemplate, error: ownError } = await supabaseAdmin
        .from("user_email_overrides")
        .select("subject, body_html")
        .eq("user_id", data.sender_user_id)
        .eq("template_slug", "lead-welcome")
        .maybeSingle();
      if (ownError) {
        console.warn("Failed to load user email override, falling back to team default", ownError);
      } else if (ownTemplate) {
        subjectSource = ownTemplate.subject || subjectSource;
        bodySource = ownTemplate.body_html || bodySource;
      }
    }

    const firstName = data.name.split(" ")[0];

    const replacePlaceholders = (text: string) =>
      text
        .replace(/\{\{name\}\}/g, firstName)
        .replace(/\{\{full_name\}\}/g, data.name)
        .replace(/\{\{email\}\}/g, data.email)
        .replace(/\{\{company\}\}/g, data.company || "")
        .replace(/\{\{cargo\}\}/g, data.cargo || "")
        .replace(/\{\{sender_name\}\}/g, senderName)
        .replace(/\{\{sender_email\}\}/g, senderEmail)
        .replace(/\{\{sender_phone\}\}/g, senderPhone);

    const subject = replacePlaceholders(subjectSource);
    const body = replacePlaceholders(bodySource);
    const fromName = replacePlaceholders(template.from_name);
    const fromEmail = replacePlaceholders(template.from_email);
    const fromField = `${fromName} <${fromEmail}>`;

    const resend = new Resend(resendApiKey);

    const sendOptions: any = {
      from: fromField,
      to: [data.email],
      subject,
      html: body,
    };

    if (template.reply_to) {
      sendOptions.reply_to = template.reply_to;
    }

    // CC only when triggered manually by an SDR (not in automatic flow)
    if (!isAutomatic && data.sender_email) {
      sendOptions.cc = [data.sender_email];
    }

    const emailResponse = await resend.emails.send(sendOptions);
    console.log("Welcome email sent:", emailResponse);

    // Post-send updates
    if (data.lead_id) {
      const nowIso = new Date().toISOString();
      const updates: Record<string, unknown> = {
        welcome_sent: true,
        welcome_sent_at: nowIso,
        last_activity_at: nowIso,
      };

      // Move stage novo -> boas_vindas only when still in novo
      const { data: leadRow } = await supabaseAdmin
        .from("leads")
        .select("kanban_stage")
        .eq("id", data.lead_id)
        .maybeSingle();
      if (leadRow?.kanban_stage === "novo") {
        updates.kanban_stage = "boas_vindas";
        updates.stage_updated_at = nowIso;
      }

      await supabaseAdmin
        .from("leads")
        .update(updates)
        .eq("id", data.lead_id);

      // Log activity (system-level when automatic)
      await supabaseAdmin.from("lead_activities").insert({
        lead_id: data.lead_id,
        user_id: null,
        activity_type: "welcome_enviado",
        content: isAutomatic
          ? "E-mail de boas-vindas enviado automaticamente"
          : `E-mail de boas-vindas enviado por ${senderName}`,
        metadata: { automatic: isAutomatic, sender_name: senderName },
      });
    }

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in send-welcome-email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

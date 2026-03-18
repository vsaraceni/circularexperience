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

    // Check if welcome was already sent
    if (data.lead_id) {
      const { data: lead } = await supabaseAdmin
        .from("leads")
        .select("welcome_sent")
        .eq("id", data.lead_id)
        .single();

      if (lead?.welcome_sent) {
        return new Response(
          JSON.stringify({ success: true, skipped: true, message: "Welcome already sent" }),
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

    const replacePlaceholders = (text: string) =>
      text
        .replace(/\{\{name\}\}/g, data.name)
        .replace(/\{\{email\}\}/g, data.email)
        .replace(/\{\{company\}\}/g, data.company || "")
        .replace(/\{\{cargo\}\}/g, data.cargo || "")
        .replace(/\{\{sender_name\}\}/g, data.sender_name || "")
        .replace(/\{\{sender_email\}\}/g, data.sender_email || "")
        .replace(/\{\{sender_phone\}\}/g, data.sender_phone || "");

    const subject = replacePlaceholders(template.subject);
    const body = replacePlaceholders(template.body_html);
    const fromField = `${template.from_name} <${template.from_email}>`;

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

    // CC the logged-in admin
    if (data.sender_email) {
      sendOptions.cc = [data.sender_email];
    }

    const emailResponse = await resend.emails.send(sendOptions);
    console.log("Welcome email sent:", emailResponse);

    // Mark as sent
    if (data.lead_id) {
      await supabaseAdmin
        .from("leads")
        .update({ welcome_sent: true })
        .eq("id", data.lead_id);
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

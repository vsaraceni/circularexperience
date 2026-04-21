import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LeadData {
  name: string;
  email: string;
  cargo: string;
  company: string;
  telefone?: string;
  whatsapp?: string;
  city?: string;
  state?: string;
}

// ─── SHA-256 helper ──────────────────────────────────────────────────────────
async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input.toLowerCase().trim());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Dispara evento Lead na CAPI (landing page) ───────────────────────────────
async function sendCapiLeadEvent(params: {
  pixelId: string;
  accessToken: string;
  email: string;
  phone?: string;
}) {
  const { pixelId, accessToken, email, phone } = params;

  const userData: Record<string, unknown> = {
    em: [await sha256(email)],
  };

  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits) userData.ph = [await sha256(digits)];
  }

  const payload = {
    access_token: accessToken,
    data: [
      {
        action_source: "website",
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        user_data: userData,
        custom_data: {
          event_source: "landing_page",
          lead_event_source: "Movimento Circular CRM",
          lead_stage: "novo",
        },
      },
    ],
  };

  const url = `https://graph.facebook.com/v18.0/${pixelId}/events`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await res.text();
  console.log("CAPI Lead event (LP) — status:", res.status, "body:", body);
  return { ok: res.ok, status: res.status };
}

// ─── Handler principal ────────────────────────────────────────────────────────
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY não configurada");
    }

    const leadData: LeadData = await req.json();

    if (!leadData.name || !leadData.email || !leadData.cargo || !leadData.company) {
      throw new Error("Campos obrigatórios faltando");
    }

    // ── 1. Salva lead no Supabase ───────────────────────────────────────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();
    const { data: insertedLead, error: insertError } = await supabaseAdmin
      .from("leads")
      .insert({
        name: leadData.name,
        email: leadData.email,
        cargo: leadData.cargo,
        company: leadData.company,
        telefone: leadData.telefone || "",
        origem: "LP",
        last_activity_at: now,
        stage_updated_at: now,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error saving lead:", insertError);
    } else if (insertedLead) {
      // ── 2. Registra atividade inicial ─────────────────────────────────────
      await supabaseAdmin.from("lead_activities").insert({
        lead_id: insertedLead.id,
        activity_type: "lead_recebido",
        content: `Lead recebido via Landing Page — ${leadData.company}`,
      });

      // ── 3. Dispara evento Lead na CAPI ────────────────────────────────────
      const accessToken = Deno.env.get("META_ACCESS_TOKEN");
      const pixelId = Deno.env.get("META_PIXEL_ID") ?? "1614314956387976";

      if (accessToken) {
        try {
          const capiResult = await sendCapiLeadEvent({
            pixelId,
            accessToken,
            email: leadData.email,
            phone: leadData.telefone || leadData.whatsapp,
          });

          if (capiResult.ok) {
            await supabaseAdmin
              .from("leads")
              .update({
                meta_last_event_sent: "Lead",
                meta_last_event_at: now,
              })
              .eq("id", insertedLead.id);
          }
        } catch (capiErr) {
          // Não bloqueia o fluxo principal se a CAPI falhar
          console.error("CAPI Lead event failed (non-blocking):", capiErr);
        }
      } else {
        console.warn("META_ACCESS_TOKEN not set — skipping CAPI event");
      }
    }

    // ── 4. Email de notificação interno ──────────────────────────────────────
    const resend = new Resend(resendApiKey);

    const optionalFields = [
      leadData.telefone
        ? `<p><strong>Telefone:</strong> ${leadData.telefone}</p>`
        : "",
      leadData.whatsapp
        ? `<p><strong>WhatsApp:</strong> <a href="https://wa.me/55${leadData.whatsapp.replace(/\D/g, "")}">${leadData.whatsapp}</a></p>`
        : "",
      leadData.city || leadData.state
        ? `<p><strong>Cidade/Estado:</strong> ${leadData.city || ""}${leadData.city && leadData.state ? " - " : ""}${leadData.state || ""}</p>`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const emailResponse = await resend.emails.send({
      from: "Circular Experience <contato@lovable.movimentocircular.io>",
      to: ["contato@movimentocircular.io"],
      subject: `Novo Lead - ${leadData.name} (${leadData.company})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #0D5332; border-bottom: 2px solid #7BCC52; padding-bottom: 10px;">
            Novo Lead - Circular Experience
          </h1>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Dados do Lead:</h2>

            <p><strong>Nome:</strong> ${leadData.name}</p>
            <p><strong>E-mail:</strong> <a href="mailto:${leadData.email}">${leadData.email}</a></p>
            <p><strong>Cargo:</strong> ${leadData.cargo}</p>
            <p><strong>Empresa:</strong> ${leadData.company}</p>
            ${optionalFields}
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Este e-mail foi enviado automaticamente pelo formulário do site Circular Experience.
          </p>
        </div>
      `,
    });

    console.log("Internal notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in send-lead-email function:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

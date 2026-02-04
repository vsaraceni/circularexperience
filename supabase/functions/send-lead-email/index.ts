import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LeadData {
  name: string;
  email: string;
  whatsapp: string;
  company: string;
  city: string;
  state: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY não configurada");
    }

    const resend = new Resend(resendApiKey);
    const leadData: LeadData = await req.json();

    // Validate required fields
    if (!leadData.name || !leadData.email || !leadData.whatsapp || !leadData.company || !leadData.city || !leadData.state) {
      throw new Error("Campos obrigatórios faltando");
    }

    const emailResponse = await resend.emails.send({
      from: "Circular Experience <onboarding@resend.dev>",
      to: ["contato@circularexperience.com.br"], // Substitua pelo e-mail de destino
      subject: `Nova Inscrição - ${leadData.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #0D5332; border-bottom: 2px solid #7BCC52; padding-bottom: 10px;">
            Nova Inscrição - Circular Experience
          </h1>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Dados do Lead:</h2>
            
            <p><strong>Nome:</strong> ${leadData.name}</p>
            <p><strong>E-mail:</strong> <a href="mailto:${leadData.email}">${leadData.email}</a></p>
            <p><strong>WhatsApp:</strong> <a href="https://wa.me/55${leadData.whatsapp.replace(/\D/g, '')}">${leadData.whatsapp}</a></p>
            <p><strong>Empresa:</strong> ${leadData.company}</p>
            <p><strong>Cidade/Estado:</strong> ${leadData.city} - ${leadData.state}</p>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Este e-mail foi enviado automaticamente pelo formulário de inscrição do site Circular Experience.
          </p>
        </div>
      `,
    });

    console.log("Lead email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    console.error("Error in send-lead-email function:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
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

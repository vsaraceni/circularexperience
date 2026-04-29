// supabase/functions/send-whatsapp-gptmaker/index.ts
//
// Inicia conversa de WhatsApp via GPT Maker para um lead específico.
// Chamada interna (service role) — geralmente disparada pelo ingest-lead.
//
// POST { lead_id }
// → { ok, status, response? }
//
// Idempotência: bloqueia se já houve envio com status='sent' nas últimas 24h.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Normaliza telefone para E.164 BR sem o "+".
 * Aceita variações como "(11) 99999-9999", "+55 11...", "5511...".
 * Sempre devolve algo como "5511999999999".
 * Retorna null se não conseguir formar um número válido.
 */
function normalizeBrPhone(input: string | null | undefined): string | null {
  if (!input) return null;
  let digits = input.replace(/\D/g, "");
  if (digits.length === 0) return null;

  // Já vem com DDI 55
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }
  // Sem DDI: 10 (fixo) ou 11 (celular) dígitos → adiciona 55
  if (digits.length === 10 || digits.length === 11) {
    return "55" + digits;
  }
  // Outros DDIs ou tamanhos válidos passam direto se >= 10
  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const gptmakerToken = Deno.env.get("GPTMAKER_TOKEN");
  const defaultChannelId = Deno.env.get("GPTMAKER_CHANNEL_ID");
  const defaultAgentId = Deno.env.get("GPTMAKER_AGENT_ID");
  const envInitialMessage = Deno.env.get("GPTMAKER_INITIAL_MESSAGE") ?? null;
  const FALLBACK_INITIAL_MESSAGE =
    "Oi {{primeiro_nome}}! 👋 Vi seu interesse em {{produto}}. Posso te contar mais? 😊";

  if (!gptmakerToken || !defaultChannelId) {
    return jsonResponse(
      {
        ok: false,
        error: "GPTMAKER_TOKEN ou GPTMAKER_CHANNEL_ID não configurado",
      },
      500,
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  let body: { lead_id?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "invalid JSON" }, 400);
  }

  const leadId = body.lead_id;
  if (!leadId || typeof leadId !== "string") {
    return jsonResponse({ ok: false, error: "lead_id é obrigatório" }, 400);
  }

  // 1. Buscar lead
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("id, name, telefone, origem, company, utm_campaign, utm_source, utm_medium, custom_fields")
    .eq("id", leadId)
    .maybeSingle();

  if (leadErr || !lead) {
    return jsonResponse(
      { ok: false, error: leadErr?.message ?? "lead não encontrado" },
      404,
    );
  }

  // 2. Buscar source para canal específico e produto_label
  let channelId = defaultChannelId;
  let agentId: string | null = defaultAgentId ?? null;
  let produtoLabel: string | null = null;
  let sourceNome: string | null = null;
  let sourceInitialMessage: string | null = null;
  if (lead.origem) {
    const { data: src } = await supabase
      .from("lead_sources")
      .select("whatsapp_channel_id, whatsapp_agent_id, produto_label, nome, whatsapp_initial_message")
      .eq("slug", lead.origem)
      .maybeSingle();
    if (src?.whatsapp_channel_id) channelId = src.whatsapp_channel_id;
    if (src?.whatsapp_agent_id) agentId = src.whatsapp_agent_id;
    produtoLabel = src?.produto_label ?? null;
    sourceNome = src?.nome ?? null;
    sourceInitialMessage = src?.whatsapp_initial_message ?? null;
  }

  // 3. Validar telefone
  const phone = normalizeBrPhone(lead.telefone);
  if (!phone) {
    await supabase.from("whatsapp_send_log").insert({
      lead_id: leadId,
      source_slug: lead.origem,
      phone: lead.telefone ?? null,
      status: "skipped_no_phone",
      error: "telefone ausente ou inválido",
    });
    return jsonResponse(
      { ok: false, status: "skipped_no_phone" },
      200,
    );
  }

  // 4. Idempotência 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: prev } = await supabase
    .from("whatsapp_send_log")
    .select("id, created_at")
    .eq("lead_id", leadId)
    .eq("status", "sent")
    .gte("created_at", since)
    .limit(1)
    .maybeSingle();

  if (prev) {
    await supabase.from("whatsapp_send_log").insert({
      lead_id: leadId,
      source_slug: lead.origem,
      phone,
      status: "skipped_duplicate",
      error: `já enviado em ${prev.created_at}`,
    });
    return jsonResponse({ ok: true, status: "skipped_duplicate" }, 200);
  }

  // 5. Montar contexto humano (produto + campanha + nome do lead) usado
  // apenas para renderizar o template de mensagem. A rota oficial
  // start-conversation aceita somente { phone, message } — não enviamos
  // metadata/agentId/contact para a GPT Maker.
  const customCampanha =
    typeof lead.custom_fields === "object" && lead.custom_fields !== null
      ? (lead.custom_fields as Record<string, unknown>).campanha_label
      : null;
  const campanha =
    (typeof customCampanha === "string" && customCampanha) ||
    lead.utm_campaign ||
    null;

  const produto = produtoLabel || sourceNome || lead.origem || null;

  // Resolve template de mensagem inicial: source > env > fallback
  const rawTemplate =
    (sourceInitialMessage && sourceInitialMessage.trim()) ||
    (envInitialMessage && envInitialMessage.trim()) ||
    FALLBACK_INITIAL_MESSAGE;

  const fullName = (lead.name ?? "").trim();
  const firstName = fullName.split(/\s+/)[0] || fullName || "tudo bem";
  const messageBody = rawTemplate
    .replace(/\{\{\s*primeiro_nome\s*\}\}/gi, firstName)
    .replace(/\{\{\s*nome\s*\}\}/gi, fullName)
    .replace(/\{\{\s*produto\s*\}\}/gi, produto ?? "nosso produto")
    .replace(/\{\{\s*empresa\s*\}\}/gi, (lead.company ?? "").toString())
    .replace(/\{\{\s*campanha\s*\}\}/gi, (campanha ?? "").toString())
    .trim();

  // 6. Iniciar conversa via canal — payload estritamente conforme docs oficiais:
  // https://developer.gptmaker.ai/api-reference/channels/start-conversation
  // Body suportado: { phone, message }. Campos extras (name, metadata, agentId,
  // contact) NÃO são reconhecidos pela rota e podem causar a mensagem não
  // chegar ao destinatário mesmo quando a API responde { success: true }.
  let response: Response;
  let respJson: unknown = null;
  try {
    const url = `https://api.gptmaker.ai/v2/channel/${channelId}/start-conversation`;
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gptmakerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
        message: messageBody,
      }),
    });
    try {
      respJson = await response.json();
    } catch {
      respJson = { raw: await response.text().catch(() => null) };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase.from("whatsapp_send_log").insert({
      lead_id: leadId,
      source_slug: lead.origem,
      phone,
      status: "error",
      error: `network: ${msg}`,
    });
    return jsonResponse({ ok: false, status: "error", error: msg }, 502);
  }

  if (!response.ok) {
    const errMsg = `gptmaker ${response.status}`;
    await supabase.from("whatsapp_send_log").insert({
      lead_id: leadId,
      source_slug: lead.origem,
      phone,
      status: "error",
      error: errMsg,
      gptmaker_response: respJson as Record<string, unknown>,
    });
    return jsonResponse(
      { ok: false, status: "error", error: errMsg, response: respJson },
      502,
    );
  }

  // 6. Sucesso → log + activity + flag no lead
  await supabase.from("whatsapp_send_log").insert({
    lead_id: leadId,
    source_slug: lead.origem,
    phone,
    status: "sent",
    gptmaker_response: {
      start_conversation: respJson,
      agent_id: agentId,
      channel_id: channelId,
      request_body: { phone, message: messageBody },
    } as Record<string, unknown>,
  });

  await supabase.from("lead_activities").insert({
    lead_id: leadId,
    activity_type: "whatsapp_iniciado",
    content: `WhatsApp iniciado via GPT Maker para ${phone}${produto ? ` (${produto}${campanha ? ` / ${campanha}` : ""})` : ""}`,
    metadata: { phone, channel_id: channelId, agent_id: agentId, produto, campanha, message_preview: messageBody.slice(0, 120) },
  });

  await supabase
    .from("leads")
    .update({
      whatsapp_sent: true,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  return jsonResponse(
    { ok: true, status: "sent", phone, response: respJson },
    200,
  );
});
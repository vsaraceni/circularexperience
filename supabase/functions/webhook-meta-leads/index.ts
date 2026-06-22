import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";
import { toE164 } from "../_shared/phone.ts";
import { pickMetaLeadEmails } from "../_shared/meta-lead-fields.ts";

/**
 * webhook-meta-leads
 *
 * Recebe leads dos Meta Lead Ads via webhook.
 * Dois modos:
 *   GET  — verificação do webhook pelo Meta (hub.challenge)
 *   POST — notificação de novo lead (leadgen)
 *
 * Variáveis de ambiente necessárias (Supabase Secrets):
 *   META_VERIFY_TOKEN      — token livre que você define no Meta Business Manager
 *   META_ACCESS_TOKEN      — Page Access Token ou System User Token com leads_retrieval
 *   META_PIXEL_ID          — Pixel ID para disparar evento Lead na CAPI
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const GRAPH_BASE = "https://graph.facebook.com/v18.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── SHA-256 helper ──────────────────────────────────────────────────────────
async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input.toLowerCase().trim());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Busca dados do lead na Graph API ────────────────────────────────────────
async function fetchLeadData(leadgenId: string, accessToken: string) {
  const fields = "id,created_time,field_data,ad_id,adset_id,campaign_id,form_id";
  const url = `${GRAPH_BASE}/${leadgenId}?fields=${fields}&access_token=${accessToken}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph API error fetching lead ${leadgenId}: ${err}`);
  }
  return res.json();
}

// ─── Dispara evento Lead na CAPI ─────────────────────────────────────────────
async function sendCapiLeadEvent(params: {
  pixelId: string;
  accessToken: string;
  fbLeadId: string;
  email?: string;
  phone?: string;
  adId?: string;
  adsetId?: string;
  campaignId?: string;
}) {
  const { pixelId, accessToken, fbLeadId, email, phone, adId, adsetId, campaignId } = params;

  const userData: Record<string, unknown> = { lead_id: fbLeadId };
  if (email) userData.em = [await sha256(email)];
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits) userData.ph = [await sha256(digits)];
  }

  const payload = {
    access_token: accessToken,
    data: [
      {
        action_source: "system_generated",
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        user_data: userData,
        custom_data: {
          event_source: "crm",
          lead_event_source: "Movimento Circular CRM",
          lead_stage: "novo",
          ...(adId && { ad_id: adId }),
          ...(adsetId && { adset_id: adsetId }),
          ...(campaignId && { campaign_id: campaignId }),
        },
      },
    ],
  };

  const url = `${GRAPH_BASE}/${pixelId}/events`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await res.text();
  console.log("CAPI Lead event — status:", res.status, "body:", body);
  return { ok: res.ok, status: res.status, body };
}

// ─── Handler principal ───────────────────────────────────────────────────────
Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const verifyToken = Deno.env.get("META_VERIFY_TOKEN");
  const accessToken = Deno.env.get("META_ACCESS_TOKEN");
  const pixelId = Deno.env.get("META_PIXEL_ID") ?? "1614314956387976";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // ── GET: verificação do webhook pelo Meta ──────────────────────────────────
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === verifyToken) {
      console.log("Webhook verified by Meta");
      return new Response(challenge ?? "", { status: 200 });
    }

    return new Response("Forbidden", { status: 403 });
  }

  // ── POST: notificação de novo lead ─────────────────────────────────────────
  if (req.method === "POST") {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Meta webhook payload:", JSON.stringify(body));

    const supabase = createClient(supabaseUrl, serviceKey);
    const results: unknown[] = [];

    // O payload pode ter múltiplos entries e changes
    const entries = (body.entry as Record<string, unknown>[]) ?? [];

    for (const entry of entries) {
      const changes = (entry.changes as Record<string, unknown>[]) ?? [];

      for (const change of changes) {
        if (change.field !== "leadgen") continue;

        const value = change.value as Record<string, unknown>;
        const leadgenId = value.leadgen_id as string;
        const pageId = value.page_id as string;

        if (!leadgenId) {
          console.warn("No leadgen_id in change, skipping");
          continue;
        }

        try {
          // 1. Busca dados do lead na Graph API
          const leadData = await fetchLeadData(leadgenId, accessToken!);
          console.log("Lead data from Graph API:", JSON.stringify(leadData));

          // 2. Mapeia field_data para campos nomeados
          const fields: Record<string, string> = {};
          for (const field of (leadData.field_data ?? []) as { name: string; values: string[] }[]) {
            // normaliza chave: lowercase, sem espaços/acentos comuns
            const key = String(field.name || "").toLowerCase().trim();
            fields[key] = field.values?.[0] ?? "";
          }
          console.log("Meta lead field keys:", Object.keys(fields));
          const emailPick = pickMetaLeadEmails(leadData.field_data ?? []);
          console.log("Meta normalized lead field keys:", Object.keys(emailPick.fields));

          // Nomes comuns nos formulários da Meta — ajuste conforme seus campos
          const name =
            fields["full_name"] ||
            fields["nome"] ||
            `${fields["first_name"] ?? ""} ${fields["last_name"] ?? ""}`.trim() ||
            "";
          const { personalEmail, workEmailRaw } = emailPick;
          // Email profissional vira o principal do CRM. Pessoal fica de backup.
          const email = workEmailRaw || personalEmail;
          const work_email = workEmailRaw || null;
          const personal_email_backup =
            personalEmail && personalEmail.toLowerCase() !== email.toLowerCase()
              ? personalEmail
              : null;
          const rawPhone =
            fields["phone_number"] ||
            fields["telefone"] ||
            fields["phone"] ||
            fields["whatsapp"] ||
            "";
          const phoneResult = toE164(rawPhone);
          const phone = phoneResult.ok ? phoneResult.value : "";
          const company =
            fields["company_name"] ||
            fields["empresa"] ||
            fields["company"] ||
            "";
          const cargo =
            fields["job_title"] ||
            fields["cargo"] ||
            fields["role"] ||
            "";

          // 3. Verifica se lead já existe (evita duplicatas)
          const { data: existing } = await supabase
            .from("leads")
            .select("id")
            .eq("fb_lead_id", leadgenId)
            .maybeSingle();

          if (existing) {
            console.log(`Lead ${leadgenId} already exists (id: ${existing.id}), skipping`);
            results.push({ leadgen_id: leadgenId, status: "duplicate", lead_id: existing.id });
            continue;
          }

          // 4. Insere lead no Supabase
          const now = new Date().toISOString();
          const campaignId = (leadData.campaign_id ?? value.campaign_id ?? null) as string | null;

          // Resolve origem/product via mapeamento de campanha Meta
          let resolvedOrigem = "meta_ads";
          let resolvedProductId: string | null = null;
          if (campaignId) {
            const { data: mapped } = await supabase
              .from("meta_campaign_product_map")
              .select("product_id, lead_sources:lead_source_id(slug, product_id, ativo)")
              .eq("campaign_id", campaignId)
              .maybeSingle();
            const src = (mapped as any)?.lead_sources;
            if (src && src.ativo) {
              resolvedOrigem = src.slug;
              resolvedProductId = (mapped as any).product_id ?? src.product_id ?? null;
            } else {
              console.warn(`Meta campaign_id ${campaignId} sem mapeamento — usando fallback meta_ads`);
              try {
                await supabase.from("lead_ingest_log").insert({
                  source_slug: "meta_ads",
                  status: "unmapped_meta_campaign",
                  error: `campaign_id ${campaignId} sem mapeamento`,
                });
              } catch (_e) { /* best-effort */ }
            }
          }

          const { data: inserted, error: insertError } = await supabase
            .from("leads")
            .insert({
              name,
              email,
              work_email,
              custom_fields: personal_email_backup
                ? { personal_email: personal_email_backup }
                : {},
              telefone: phone,
              company,
              cargo,
              fb_lead_id: leadgenId,
              origem: resolvedOrigem,
              product_id: resolvedProductId,
              ad_id: leadData.ad_id ?? value.ad_id ?? null,
              adset_id: leadData.adset_id ?? value.adset_id ?? null,
              campaign_id: campaignId,
              last_activity_at: now,
              stage_updated_at: now,
            })
            .select("id")
            .single();

          if (insertError) {
            console.error("Error inserting lead:", insertError);
            results.push({ leadgen_id: leadgenId, status: "error", error: insertError.message });
            continue;
          }

          console.log(`Lead inserted: id=${inserted.id}, fb_lead_id=${leadgenId}`);

          // 5. Registra atividade inicial
          await supabase.from("lead_activities").insert({
            lead_id: inserted.id,
            activity_type: "lead_recebido",
            content: `Lead recebido via Meta Lead Ads — ${company || "empresa não informada"}`,
          });

          // 6. Dispara evento Lead na CAPI
          const capiResult = await sendCapiLeadEvent({
            pixelId,
            accessToken: accessToken!,
            fbLeadId: leadgenId,
            email: email || undefined,
            phone: phone || undefined,
            adId: leadData.ad_id,
            adsetId: leadData.adset_id,
            campaignId: leadData.campaign_id,
          });

          // 7. Atualiza timestamps CAPI no lead
          await supabase
            .from("leads")
            .update({
              meta_last_event_sent: "Lead",
              meta_last_event_at: now,
            })
            .eq("id", inserted.id);

          // 7b. Disparo WhatsApp agora é responsabilidade do trigger
          // tg_leads_whatsapp_auto (DB AFTER INSERT). Mantemos esta função
          // limpa para evitar double-fire caso o webhook volte a ser usado.

          results.push({
            leadgen_id: leadgenId,
            status: "created",
            lead_id: inserted.id,
            capi: capiResult,
          });
        } catch (err) {
          console.error(`Error processing leadgen_id ${leadgenId}:`, err);
          results.push({ leadgen_id: leadgenId, status: "error", error: String(err) });
        }
      }
    }

    // Meta espera status 200 rapidamente — respondemos mesmo com erros parciais
    return new Response(JSON.stringify({ received: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405 });
});

import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendAppEmail } from '../_shared/transactional-email-templates/app-email.ts'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) return json({ error: 'Unauthorized' }, 401)

  let leadId: unknown
  try {
    leadId = (await req.json())?.leadId
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }
  if (typeof leadId !== 'string' || !UUID_RE.test(leadId)) return json({ error: 'leadId required' }, 400)

  // Lead must be visible to the caller under RLS
  const { data: lead, error: leadError } = await userClient
    .from('leads')
    .select('id, name, company, cargo, telefone, email, work_email, briefing_notes, assigned_to')
    .eq('id', leadId)
    .maybeSingle()
  if (leadError || !lead) return json({ error: 'Lead not found' }, 404)

  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const ownerId = lead.assigned_to || user.id
  const { data: owner } = await admin.from('profiles').select('email').eq('id', ownerId).maybeSingle()
  if (!owner?.email) return json({ success: false, reason: 'no_owner_email' })

  try {
    const result = await sendAppEmail(admin, 'call-scheduled-alert', owner.email, {
      idempotencyKey: `call-alert-${lead.id}-${Date.now()}`,
      templateData: {
        leadName: lead.name,
        company: lead.company || '',
        cargo: lead.cargo || '',
        telefone: lead.telefone || '',
        email: lead.email,
        workEmail: lead.work_email || '',
        briefingNotes: lead.briefing_notes || '',
        leadId: lead.id,
      },
    })
    return json({ success: result.sent })
  } catch (e) {
    console.error('call-scheduled-alert send failed', e instanceof Error ? e.message : e)
    return json({ error: 'Failed to send' }, 500)
  }
})

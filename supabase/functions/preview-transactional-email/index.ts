import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'

// Renders all registered templates with their previewData (overrides applied).
//
// Authorization (verify_jwt = false, so we validate here):
//   1. LOVABLE_API_KEY  — platform/system calls (template preview tooling)
//   2. User JWT         — any approved CRM member (has a role + approval_status = 'approved').
//      Everyone can *see* the templates; editing is enforced by RLS on
//      email_template_overrides / email_templates (manage_templates or admin).

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

interface PreviewResult {
  templateName: string
  displayName: string
  subject: string
  html: string
  status: 'ready' | 'preview_data_required' | 'render_failed'
  errorMessage?: string
  editableFields?: Record<string, { label: string; default: string; placeholder: string }>
  currentOverrides?: Record<string, unknown>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY')
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return json({ error: 'Server configuration error' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return json({ error: 'Unauthorized' }, 401)

  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  let authorized = !!(apiKey && token === apiKey)

  if (!authorized) {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser(token)
    if (!authError && user) {
      const admin = createClient(supabaseUrl, serviceKey)
      const [{ data: roleRow }, { data: profileRow }] = await Promise.all([
        admin.from('user_roles').select('role').eq('user_id', user.id).limit(1).maybeSingle(),
        admin.from('profiles').select('approval_status').eq('id', user.id).maybeSingle(),
      ])
      authorized = !!roleRow && profileRow?.approval_status === 'approved'
    }
  }

  if (!authorized) return json({ error: 'Unauthorized' }, 401)

  // Current global overrides (text customisations, tier-alert config, ...)
  const admin = createClient(supabaseUrl, serviceKey)
  const allOverrides: Record<string, Record<string, unknown>> = {}
  const { data: overrideRows, error: overridesError } = await admin
    .from('email_template_overrides')
    .select('template_name, overrides')
  if (overridesError) {
    console.error('Failed to load email_template_overrides', overridesError)
  }
  for (const row of overrideRows ?? []) {
    allOverrides[row.template_name] = (row.overrides ?? {}) as Record<string, unknown>
  }

  const results: PreviewResult[] = []

  for (const name of Object.keys(TEMPLATES)) {
    const entry = TEMPLATES[name]
    const displayName = entry.displayName || name

    if (!entry.previewData) {
      results.push({
        templateName: name,
        displayName,
        subject: '',
        html: '',
        status: 'preview_data_required',
        editableFields: entry.editableFields,
        currentOverrides: allOverrides[name] ?? {},
      })
      continue
    }

    try {
      const previewProps: Record<string, unknown> = { ...entry.previewData }
      if (allOverrides[name]) previewProps.overrides = allOverrides[name]

      const html = await renderAsync(React.createElement(entry.component, previewProps))
      const resolvedSubject =
        typeof entry.subject === 'function' ? entry.subject(previewProps) : entry.subject

      results.push({
        templateName: name,
        displayName,
        subject: resolvedSubject,
        html,
        status: 'ready',
        editableFields: entry.editableFields,
        currentOverrides: allOverrides[name] ?? {},
      })
    } catch (err) {
      console.error('Failed to render template for preview', { template: name, error: err })
      results.push({
        templateName: name,
        displayName,
        subject: '',
        html: '',
        status: 'render_failed',
        errorMessage: err instanceof Error ? err.message : String(err),
        editableFields: entry.editableFields,
        currentOverrides: allOverrides[name] ?? {},
      })
    }
  }

  return json({ templates: results })
})

import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Renders all registered templates with their previewData.
// Accepts LOVABLE_API_KEY (system) or authenticated admin JWT.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')

  // Check LOVABLE_API_KEY first
  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  let authorized = !!(apiKey && token === apiKey)

  // If not API key, check if authenticated admin
  if (!authorized && token) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!
    const sb = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user } } = await sb.auth.getUser(token)
    if (user) {
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const sbService = createClient(supabaseUrl, serviceKey)
      const { data: roleData } = await sbService
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle()
      authorized = !!roleData
    }
  }

  if (!authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Fetch all overrides from DB
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  let allOverrides: Record<string, Record<string, any>> = {}
  if (supabaseUrl && supabaseServiceKey) {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const sb = createClient(supabaseUrl, supabaseServiceKey)
    const { data: rows } = await sb.from('email_template_overrides').select('template_name, overrides')
    if (rows) {
      for (const r of rows) {
        allOverrides[r.template_name] = r.overrides as Record<string, any>
      }
    }
  }

  const templateNames = Object.keys(TEMPLATES)
  const results: Array<{
    templateName: string
    displayName: string
    subject: string
    html: string
    status: 'ready' | 'preview_data_required' | 'render_failed'
    errorMessage?: string
    editableFields?: Record<string, { label: string; default: string; placeholder: string }>
    currentOverrides?: Record<string, any>
  }> = []

  for (const name of templateNames) {
    const entry = TEMPLATES[name]
    const displayName = entry.displayName || name

    if (!entry.previewData) {
      results.push({
        templateName: name,
        displayName,
        subject: '',
        html: '',
        status: 'preview_data_required',
      })
      continue
    }

    try {
      const previewDataWithOverrides = { ...entry.previewData }
      if (allOverrides[name]) {
        previewDataWithOverrides.overrides = allOverrides[name]
      }
      const html = await renderAsync(
        React.createElement(entry.component, previewDataWithOverrides)
      )
      const resolvedSubject =
        typeof entry.subject === 'function'
          ? entry.subject(entry.previewData)
          : entry.subject

      results.push({
        templateName: name,
        displayName,
        subject: resolvedSubject,
        html,
        status: 'ready',
        editableFields: entry.editableFields,
        currentOverrides: allOverrides[name] || {},
      })
    } catch (err) {
      console.error('Failed to render template for preview', {
        template: name,
        error: err,
      })
      results.push({
        templateName: name,
        displayName,
        subject: '',
        html: '',
        status: 'render_failed',
        errorMessage: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return new Response(JSON.stringify({ templates: results }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})

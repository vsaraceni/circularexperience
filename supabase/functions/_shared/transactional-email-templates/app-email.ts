import { sendTemplateEmail, type SendTemplateEmailResult } from './send-email.ts'

// Server-only wrapper around sendTemplateEmail that keeps this app's behavior:
// - merges admin text overrides (email_template_overrides) into templateData
// - records each outcome in email_send_log
// deno-lint-ignore no-explicit-any
type AnyClient = any

export async function sendAppEmail(
  supabase: AnyClient,
  templateName: string,
  recipient: string,
  options: { templateData?: Record<string, any>; idempotencyKey?: string } = {},
): Promise<SendTemplateEmailResult> {
  const templateData: Record<string, any> = { ...(options.templateData ?? {}) }

  const { data: overrideRow, error: overrideError } = await supabase
    .from('email_template_overrides')
    .select('overrides')
    .eq('template_name', templateName)
    .maybeSingle()
  if (overrideError) {
    console.error('Failed to load email overrides', { templateName, code: overrideError.code })
  } else if (overrideRow?.overrides && typeof overrideRow.overrides === 'object') {
    templateData.overrides = overrideRow.overrides
  }

  const log = async (status: string, error_message?: string) => {
    const { error } = await supabase.from('email_send_log').insert({
      message_id: null,
      template_name: templateName,
      recipient_email: recipient,
      status,
      ...(error_message ? { error_message } : {}),
    })
    if (error) console.error('email_send_log insert failed', { code: error.code, message: error.message })
  }

  try {
    const result = await sendTemplateEmail(templateName, recipient, {
      templateData,
      idempotencyKey: options.idempotencyKey,
    })
    await log(result.sent ? 'sent' : 'suppressed')
    return result
  } catch (err) {
    await log('failed', err instanceof Error ? err.message : String(err))
    throw err
  }
}

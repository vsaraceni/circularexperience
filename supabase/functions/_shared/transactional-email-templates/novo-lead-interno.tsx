import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Muti CRM"
const CRM_URL = "https://crm.movimentocircular.io/admin/pipeline"

interface NovoLeadInternoOverrides {
  title?: string
  subtitle?: string
  cta_text?: string
  footer?: string
}

interface NovoLeadInternoProps {
  lead_name?: string
  lead_email?: string
  lead_company?: string
  lead_cargo?: string
  lead_telefone?: string
  source_nome?: string
  custom_fields?: Record<string, unknown>
  lead_id?: string
  overrides?: NovoLeadInternoOverrides
}

const NovoLeadInternoEmail = ({
  lead_name = '',
  lead_email = '',
  lead_company = '',
  lead_cargo = '',
  lead_telefone = '',
  source_nome = '',
  custom_fields = {},
  lead_id = '',
  overrides = {},
}: NovoLeadInternoProps) => {
  const ctaUrl = lead_id ? `${CRM_URL}?lead=${lead_id}` : CRM_URL
  const titleText = overrides.title || 'Novo lead recebido'
  const subtitleText = overrides.subtitle || `Um novo lead chegou via <strong style="color:#5F2558">${source_nome || 'formulário externo'}</strong>.`
  const ctaText = overrides.cta_text || '👀 Ver no Pipeline'
  const footerText = overrides.footer || `${SITE_NAME} — Notificação automática de ingest`

  const customEntries = Object.entries(custom_fields || {}).filter(([, v]) => v !== null && v !== undefined && v !== '')

  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>📥 Novo lead — {lead_company || lead_name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerBar}>
            <Text style={headerTextStyle}>📥 {SITE_NAME}</Text>
          </Section>

          <Heading style={h1}>{titleText}</Heading>
          <Text style={subtitle} dangerouslySetInnerHTML={{ __html: subtitleText }} />

          <Section style={cardContainer}>
            <Text style={cardTitle}>📋 Dados do Lead</Text>
            <Section style={dataRow}><Text style={dataLabel}>Nome</Text><Text style={dataValue}>{lead_name || '—'}</Text></Section>
            <Section style={dataRow}><Text style={dataLabel}>Empresa</Text><Text style={dataValue}>{lead_company || '—'}</Text></Section>
            <Section style={dataRow}><Text style={dataLabel}>Cargo</Text><Text style={dataValue}>{lead_cargo || '—'}</Text></Section>
            <Section style={dataRow}><Text style={dataLabel}>Email</Text><Text style={dataValue}>{lead_email || '—'}</Text></Section>
            <Section style={dataRow}><Text style={dataLabel}>Telefone</Text><Text style={dataValue}>{lead_telefone || '—'}</Text></Section>
            <Section style={dataRow}><Text style={dataLabel}>Origem</Text><Text style={dataValue}>{source_nome || '—'}</Text></Section>
          </Section>

          {customEntries.length > 0 ? (
            <Section style={cardContainer}>
              <Text style={cardTitle}>🧩 Campos extras</Text>
              {customEntries.map(([k, v]) => (
                <Section key={k} style={dataRow}>
                  <Text style={dataLabel}>{k}</Text>
                  <Text style={dataValue}>{String(v)}</Text>
                </Section>
              ))}
            </Section>
          ) : null}

          <Section style={ctaContainer}>
            <Button style={ctaButton} href={ctaUrl}>{ctaText}</Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>{footerText}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: NovoLeadInternoEmail,
  subject: (data: Record<string, any>) =>
    `📥 Novo lead — ${data.lead_company || data.lead_name || 'Lead'}`,
  displayName: 'Novo lead (ingest interno)',
  previewData: {
    lead_name: 'Joana Silva',
    lead_company: 'Acme Verde S.A.',
    lead_cargo: 'Diretora de ESG',
    lead_email: 'joana@acmeverde.com',
    lead_telefone: '5511988887777',
    source_nome: 'Landing CE',
    custom_fields: { porte: '501-2000', interesse: 'Workshop in-company' },
    lead_id: 'abc-123',
  },
  editableFields: {
    title: { label: 'Título', default: 'Novo lead recebido', placeholder: 'Novo lead recebido' },
    subtitle: { label: 'Subtítulo (HTML)', default: 'Um novo lead chegou via <strong style="color:#5F2558">{{source_nome}}</strong>.', placeholder: 'Um novo lead chegou via...' },
    cta_text: { label: 'Texto do botão', default: '👀 Ver no Pipeline', placeholder: '👀 Ver no Pipeline' },
    footer: { label: 'Rodapé', default: 'Muti CRM — Notificação automática de ingest', placeholder: 'Muti CRM — Notificação...' },
  },
} satisfies TemplateEntry

// Styles
const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const headerBar = { backgroundColor: '#5F2558', padding: '16px 24px', borderRadius: '8px 8px 0 0' }
const headerTextStyle = { color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, margin: '0', letterSpacing: '0.5px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#5F2558', margin: '24px 24px 8px' }
const subtitle = { fontSize: '14px', color: '#555', lineHeight: '1.6', margin: '0 24px 24px' }
const cardContainer = { backgroundColor: '#f0ecea', borderRadius: '8px', padding: '16px 20px', margin: '0 24px 16px' }
const cardTitle = { fontSize: '13px', fontWeight: '700' as const, color: '#5F2558', margin: '0 0 12px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const dataRow = { display: 'flex' as const, justifyContent: 'space-between' as const, padding: '6px 0', borderBottom: '1px solid #e0dcda' }
const dataLabel = { fontSize: '13px', color: '#888', margin: '0', fontWeight: '500' as const }
const dataValue = { fontSize: '13px', color: '#333', margin: '0', fontWeight: '600' as const }
const ctaContainer = { textAlign: 'center' as const, margin: '0 24px 24px' }
const ctaButton = { backgroundColor: '#2FB2C0', color: '#ffffff', padding: '14px 32px', borderRadius: '8px', fontSize: '15px', fontWeight: '600' as const, textDecoration: 'none', display: 'inline-block' }
const hr = { borderTop: '1px solid #f0ecea', margin: '0 24px', borderBottom: 'none', borderLeft: 'none', borderRight: 'none' }
const footer = { fontSize: '11px', color: '#999', margin: '16px 24px 24px' }
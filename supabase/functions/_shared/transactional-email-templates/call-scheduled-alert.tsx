import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Muti CRM"
const CRM_URL = "https://circularexperience.lovable.app/admin/dashboard"

interface CallScheduledAlertProps {
  leadName?: string
  company?: string
  cargo?: string
  telefone?: string
  email?: string
  workEmail?: string
  briefingNotes?: string
  leadId?: string
}

const CallScheduledAlertEmail = ({
  leadName = '',
  company = '',
  cargo = '',
  telefone = '',
  email = '',
  workEmail = '',
  briefingNotes = '',
  leadId = '',
}: CallScheduledAlertProps) => {
  const hasBriefing = briefingNotes && briefingNotes.trim().length > 0
  const ctaUrl = leadId ? `${CRM_URL}?lead=${leadId}` : CRM_URL

  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>🔔 Nova proposta solicitada — {company || leadName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header bar */}
          <Section style={headerBar}>
            <Text style={headerText}>🔔 {SITE_NAME}</Text>
          </Section>

          <Heading style={h1}>Nova proposta solicitada</Heading>
          <Text style={subtitle}>
            Um lead avançou para <strong style={{ color: '#5F2558' }}>Call Agendada</strong>. 
            Você tem <strong style={{ color: '#EB626D' }}>2 dias úteis</strong> para elaborar a proposta.
          </Text>

          {/* Lead data card */}
          <Section style={cardContainer}>
            <Text style={cardTitle}>📋 Dados do Lead</Text>
            <Section style={dataRow}>
              <Text style={dataLabel}>Nome</Text>
              <Text style={dataValue}>{leadName || '—'}</Text>
            </Section>
            <Section style={dataRow}>
              <Text style={dataLabel}>Empresa</Text>
              <Text style={dataValue}>{company || '—'}</Text>
            </Section>
            <Section style={dataRow}>
              <Text style={dataLabel}>Cargo</Text>
              <Text style={dataValue}>{cargo || '—'}</Text>
            </Section>
            <Section style={dataRow}>
              <Text style={dataLabel}>Telefone</Text>
              <Text style={dataValue}>{telefone || '—'}</Text>
            </Section>
            <Section style={dataRow}>
              <Text style={dataLabel}>Email</Text>
              <Text style={dataValue}>{email || '—'}</Text>
            </Section>
            {workEmail ? (
              <Section style={dataRow}>
                <Text style={dataLabel}>Email profissional</Text>
                <Text style={dataValue}>{workEmail}</Text>
              </Section>
            ) : null}
          </Section>

          {/* Briefing section */}
          <Section style={briefingContainer}>
            <Text style={cardTitle}>📝 Briefing</Text>
            {hasBriefing ? (
              <Text style={briefingText}>{briefingNotes}</Text>
            ) : (
              <Section style={noBriefingBox}>
                <Text style={noBriefingText}>
                  ⚠️ Sem briefing preenchido ainda. Preencha antes de elaborar a proposta.
                </Text>
              </Section>
            )}
          </Section>

          {/* CTA */}
          <Section style={ctaContainer}>
            <Button style={ctaButton} href={ctaUrl}>
              📄 Elaborar Proposta
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>{SITE_NAME} — Alerta automático de proposta</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: CallScheduledAlertEmail,
  subject: (data: Record<string, any>) =>
    `🔔 Nova proposta solicitada — ${data.company || data.leadName || 'Lead'}`,
  displayName: 'Alerta de Proposta (Call Agendada)',
  previewData: {
    leadName: 'Maria Santos',
    company: 'Natura Cosméticos',
    cargo: 'Gerente de Sustentabilidade',
    telefone: '(11) 98765-4321',
    email: 'maria@natura.com.br',
    workEmail: 'maria.santos@natura.net',
    briefingNotes: 'Interesse em workshop imersivo para 50 colaboradores. Foco em economia circular aplicada à cadeia de suprimentos. Orçamento aprovado para Q2.',
    leadId: 'abc-123',
  },
} satisfies TemplateEntry

// Styles — Movimento Circular palette
const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }

const headerBar = {
  backgroundColor: '#5F2558',
  padding: '16px 24px',
  borderRadius: '8px 8px 0 0',
}
const headerText = {
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  margin: '0',
  letterSpacing: '0.5px',
}

const h1 = {
  fontSize: '22px',
  fontWeight: '700' as const,
  color: '#5F2558',
  margin: '24px 24px 8px',
}
const subtitle = {
  fontSize: '14px',
  color: '#555',
  lineHeight: '1.6',
  margin: '0 24px 24px',
}

const cardContainer = {
  backgroundColor: '#f0ecea',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 24px 16px',
}
const cardTitle = {
  fontSize: '13px',
  fontWeight: '700' as const,
  color: '#5F2558',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}
const dataRow = {
  display: 'flex' as const,
  justifyContent: 'space-between' as const,
  padding: '6px 0',
  borderBottom: '1px solid #e0dcda',
}
const dataLabel = {
  fontSize: '13px',
  color: '#888',
  margin: '0',
  fontWeight: '500' as const,
}
const dataValue = {
  fontSize: '13px',
  color: '#333',
  margin: '0',
  fontWeight: '600' as const,
}

const briefingContainer = {
  backgroundColor: '#f0ecea',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 24px 24px',
}
const briefingText = {
  fontSize: '13px',
  color: '#333',
  lineHeight: '1.6',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
}
const noBriefingBox = {
  backgroundColor: '#fffbeb',
  borderRadius: '6px',
  borderLeft: '4px solid #F4A736',
  padding: '12px 16px',
}
const noBriefingText = {
  fontSize: '13px',
  color: '#92400e',
  margin: '0',
}

const ctaContainer = { textAlign: 'center' as const, margin: '0 24px 24px' }
const ctaButton = {
  backgroundColor: '#2FB2C0',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  display: 'inline-block',
}

const hr = {
  borderTop: '1px solid #f0ecea',
  margin: '0 24px',
  borderBottom: 'none',
  borderLeft: 'none',
  borderRight: 'none',
}
const footer = {
  fontSize: '11px',
  color: '#999',
  margin: '16px 24px 24px',
}

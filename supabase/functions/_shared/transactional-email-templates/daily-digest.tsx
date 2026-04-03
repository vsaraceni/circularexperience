import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Muti CRM"
const CRM_URL = "https://circularexperience.lovable.app/admin/dashboard"

interface Mission {
  label: string
  count: number
  color: string
}

interface DailyDigestOverrides {
  greeting?: string
  cta_text?: string
  resolved_title?: string
  resolved_text?: string
  footer?: string
}

interface DailyDigestProps {
  missions?: Mission[]
  resolvedCount?: number
  totalMissions?: number
  allResolved?: boolean
  dateStr?: string
  overrides?: DailyDigestOverrides
}

const DailyDigestEmail = ({
  missions = [],
  resolvedCount = 0,
  totalMissions = 5,
  allResolved = false,
  dateStr = '',
  overrides = {},
}: DailyDigestProps) => {
  const progressPercent = totalMissions > 0 ? (resolvedCount / totalMissions) * 100 : 0
  const greeting = overrides.greeting || 'Bom dia!'
  const ctaText = overrides.cta_text || '🚀 Vamos resolver isso!'
  const resolvedTitle = overrides.resolved_title || '🎉 Tudo em dia!'
  const resolvedText = overrides.resolved_text || 'Pipeline sem pendências. Continue assim!'
  const footerText = overrides.footer || `${SITE_NAME} — Resumo matinal automático`

  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>
        {allResolved
          ? '🎉 Tudo em dia! Pipeline sem pendências.'
          : `🎯 ${totalMissions - resolvedCount} missões pendentes hoje`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerBar}>
            <Text style={headerText}>☀️ {SITE_NAME}</Text>
          </Section>

          <Section style={contentPadding}>
            <Heading style={h1}>{greeting}</Heading>
            <Text style={dateText}>{dateStr}</Text>

            <Section style={progressContainer}>
              <Text style={progressLabel}>
                🎯 Missões: {resolvedCount}/{totalMissions}
              </Text>
              <Section style={progressBarOuter}>
                <Section style={{ ...progressBarInner, width: `${progressPercent}%` }} />
              </Section>
            </Section>

            {allResolved ? (
              <Section style={allResolvedBox}>
                <Heading style={allResolvedHeading}>{resolvedTitle}</Heading>
                <Text style={allResolvedTextStyle}>{resolvedText}</Text>
              </Section>
            ) : (
              <Section style={missionsContainer}>
                {missions.map((m, i) => (
                  <Section key={i} style={{
                    ...missionRow,
                    borderLeftColor: m.color,
                    backgroundColor: m.count === 0 ? '#e8f8f5' : m.count >= 3 ? '#fef2f2' : '#fffbeb',
                  }}>
                    <Text style={missionLabel}>{m.label}</Text>
                    <Text style={{ ...missionCount, color: m.count === 0 ? '#2FB2C0' : m.color }}>
                      {m.count === 0 ? '✅' : m.count}
                    </Text>
                  </Section>
                ))}
              </Section>
            )}

            {!allResolved && (
              <Section style={ctaContainer}>
                <Button style={ctaButton} href={CRM_URL}>
                  {ctaText}
                </Button>
              </Section>
            )}
          </Section>

          <Hr style={hr} />
          <Text style={footer}>{footerText}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: DailyDigestEmail,
  subject: (data: Record<string, any>) =>
    data.allResolved
      ? '☀️ Bom dia — Tudo em dia! 🎉'
      : `☀️ Resumo do dia — ${(data.totalMissions || 5) - (data.resolvedCount || 0)} pendência(s)`,
  displayName: 'Resumo matinal (Missões do Dia)',
  previewData: {
    missions: [
      { label: 'Novos', count: 2, color: '#F4A736' },
      { label: 'Follow-up', count: 0, color: '#2FB2C0' },
      { label: 'Agendamento', count: 3, color: '#EB626D' },
      { label: 'Calls', count: 1, color: '#F4A736' },
      { label: 'Briefing', count: 0, color: '#2FB2C0' },
    ],
    resolvedCount: 2,
    totalMissions: 5,
    allResolved: false,
    dateStr: 'segunda-feira, 3 de abril',
  },
  editableFields: {
    greeting: { label: 'Saudação', default: 'Bom dia!', placeholder: 'Bom dia!' },
    cta_text: { label: 'Texto do botão CTA', default: '🚀 Vamos resolver isso!', placeholder: '🚀 Vamos resolver isso!' },
    resolved_title: { label: 'Título (tudo resolvido)', default: '🎉 Tudo em dia!', placeholder: '🎉 Tudo em dia!' },
    resolved_text: { label: 'Texto (tudo resolvido)', default: 'Pipeline sem pendências. Continue assim!', placeholder: 'Pipeline sem pendências. Continue assim!' },
    footer: { label: 'Rodapé', default: 'Muti CRM — Resumo matinal automático', placeholder: 'Muti CRM — Resumo matinal automático' },
  },
} satisfies TemplateEntry

// Styles
const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const headerBar = { backgroundColor: '#5F2558', padding: '16px 24px', borderRadius: '8px 8px 0 0' }
const headerText = { color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, margin: '0', letterSpacing: '0.5px' }
const contentPadding = { padding: '24px 24px 0' }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: '#5F2558', margin: '0 0 4px' }
const dateText = { fontSize: '13px', color: '#666', margin: '0 0 24px' }
const progressContainer = { marginBottom: '24px' }
const progressLabel = { fontSize: '13px', fontWeight: '600' as const, color: '#333', margin: '0 0 8px' }
const progressBarOuter = { width: '100%', height: '8px', backgroundColor: '#f0ecea', borderRadius: '4px', overflow: 'hidden' as const }
const progressBarInner = { height: '8px', backgroundColor: '#2FB2C0', borderRadius: '4px', minWidth: '1px' }
const allResolvedBox = { backgroundColor: '#e8f8f5', borderRadius: '12px', padding: '24px', textAlign: 'center' as const, margin: '0 0 24px', border: '1px solid #b2dfdb' }
const allResolvedHeading = { fontSize: '20px', color: '#2FB2C0', margin: '0 0 8px', fontWeight: '700' as const }
const allResolvedTextStyle = { fontSize: '14px', color: '#00796b', margin: '0' }
const missionsContainer = { marginBottom: '24px' }
const missionRow = { display: 'flex' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid', marginBottom: '8px' }
const missionLabel = { fontSize: '14px', fontWeight: '500' as const, color: '#333', margin: '0' }
const missionCount = { fontSize: '18px', fontWeight: '700' as const, margin: '0' }
const ctaContainer = { textAlign: 'center' as const, margin: '0 0 24px' }
const ctaButton = { backgroundColor: '#5F2558', color: '#ffffff', padding: '14px 32px', borderRadius: '8px', fontSize: '15px', fontWeight: '600' as const, textDecoration: 'none', display: 'inline-block' }
const hr = { borderTop: '1px solid #f0ecea', margin: '0 24px', borderBottom: 'none', borderLeft: 'none', borderRight: 'none' }
const footer = { fontSize: '11px', color: '#999', margin: '16px 24px 24px' }

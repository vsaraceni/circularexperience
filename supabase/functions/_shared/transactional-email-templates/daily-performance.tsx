import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Muti CRM"

interface OperatorStats {
  name: string
  stageChanges: number
  appointments: number
  proposals: number
  deals: number
}

interface DailyPerformanceOverrides {
  title?: string
  footer?: string
}

interface DailyPerformanceProps {
  operators?: OperatorStats[]
  dateStr?: string
  totalStageChanges?: number
  totalAppointments?: number
  totalProposals?: number
  totalDeals?: number
  whatsappText?: string
  overrides?: DailyPerformanceOverrides
}

const DailyPerformanceEmail = ({
  operators = [],
  dateStr = '',
  totalStageChanges = 0,
  totalAppointments = 0,
  totalProposals = 0,
  totalDeals = 0,
  whatsappText = '',
  overrides = {},
}: DailyPerformanceProps) => {
  const titleText = overrides.title || 'Performance do dia'
  const footerText = overrides.footer || `${SITE_NAME} — Relatório de performance automático`

  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>📊 Performance do dia — {dateStr}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerBar}>
            <Text style={headerText}>📊 {SITE_NAME}</Text>
          </Section>

          <Heading style={h1}>{titleText}</Heading>
          <Text style={dateLabel}>{dateStr}</Text>

          <Section style={totalsCard}>
            <Text style={totalsTitle}>🏆 Total do time</Text>
            <Section style={totalsGrid}>
              <Section style={totalItem}><Text style={totalNumber}>{totalStageChanges}</Text><Text style={totalLabelStyle}>↗️ Avanços</Text></Section>
              <Section style={totalItem}><Text style={totalNumber}>{totalAppointments}</Text><Text style={totalLabelStyle}>📅 Agend.</Text></Section>
              <Section style={totalItem}><Text style={totalNumber}>{totalProposals}</Text><Text style={totalLabelStyle}>📄 Propostas</Text></Section>
              <Section style={totalItem}><Text style={totalNumber}>{totalDeals}</Text><Text style={totalLabelStyle}>🤝 Deals</Text></Section>
            </Section>
          </Section>

          {operators.map((op, i) => (
            <Section key={i} style={operatorCard}>
              <Text style={operatorName}>👤 {op.name}</Text>
              <Section style={statsRow}><Text style={statItem}><span style={statIcon}>↗️</span> Avanços: <strong>{op.stageChanges}</strong></Text></Section>
              <Section style={statsRow}><Text style={statItem}><span style={statIcon}>📅</span> Agendamentos: <strong>{op.appointments}</strong></Text></Section>
              <Section style={statsRow}><Text style={statItem}><span style={statIcon}>📄</span> Propostas: <strong>{op.proposals}</strong></Text></Section>
              <Section style={statsRow}><Text style={statItem}><span style={statIcon}>🤝</span> Deals: <strong>{op.deals}</strong></Text></Section>
            </Section>
          ))}

          {operators.length === 0 && (
            <Section style={emptyState}><Text style={emptyText}>Nenhuma atividade registrada hoje.</Text></Section>
          )}

          <Section style={whatsappSection}>
            <Text style={whatsappTitle}>📋 Copie e cole no WhatsApp:</Text>
            <Section style={whatsappBlock}><Text style={whatsappContent}>{whatsappText || 'Sem dados'}</Text></Section>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>{footerText}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: DailyPerformanceEmail,
  subject: (data: Record<string, any>) =>
    `📊 Performance do dia — ${data.dateStr || 'Hoje'}`,
  displayName: 'Relatório de Performance Diário',
  previewData: {
    operators: [
      { name: 'João Silva', stageChanges: 5, appointments: 2, proposals: 1, deals: 0 },
      { name: 'Maria Santos', stageChanges: 3, appointments: 1, proposals: 0, deals: 1 },
    ],
    dateStr: 'quinta-feira, 3 de abril',
    totalStageChanges: 8,
    totalAppointments: 3,
    totalProposals: 1,
    totalDeals: 1,
    whatsappText: '📊 *Performance — quinta, 3 de abril*\n\n👤 *João Silva*\n↗️ Avanços: 5\n📅 Agendamentos: 2\n📄 Propostas: 1\n🤝 Deals: 0\n\n👤 *Maria Santos*\n↗️ Avanços: 3\n📅 Agendamentos: 1\n📄 Propostas: 0\n🤝 Deals: 1\n\n🏆 *Total do time*\n↗️ 8 | 📅 3 | 📄 1 | 🤝 1',
  },
  editableFields: {
    title: { label: 'Título', default: 'Performance do dia', placeholder: 'Performance do dia' },
    footer: { label: 'Rodapé', default: 'Muti CRM — Relatório de performance automático', placeholder: 'Muti CRM — Relatório de performance automático' },
  },
} satisfies TemplateEntry

// Styles
const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const headerBar = { backgroundColor: '#5F2558', padding: '16px 24px', borderRadius: '8px 8px 0 0' }
const headerText = { color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, margin: '0', letterSpacing: '0.5px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#5F2558', margin: '24px 24px 4px' }
const dateLabel = { fontSize: '13px', color: '#666', margin: '0 24px 20px' }
const totalsCard = { backgroundColor: '#5F2558', borderRadius: '10px', padding: '20px', margin: '0 24px 20px' }
const totalsTitle = { color: '#ffffff', fontSize: '14px', fontWeight: '700' as const, margin: '0 0 16px', textAlign: 'center' as const }
const totalsGrid = { display: 'flex' as const, justifyContent: 'space-around' as const }
const totalItem = { textAlign: 'center' as const }
const totalNumber = { fontSize: '24px', fontWeight: '700' as const, color: '#F1F4C5', margin: '0' }
const totalLabelStyle = { fontSize: '11px', color: '#d4c6d2', margin: '4px 0 0' }
const operatorCard = { backgroundColor: '#f0ecea', borderRadius: '8px', padding: '16px 20px', margin: '0 24px 10px', borderLeft: '4px solid #2FB2C0' }
const operatorName = { fontSize: '15px', fontWeight: '700' as const, color: '#5F2558', margin: '0 0 10px' }
const statsRow = { padding: '3px 0' }
const statItem = { fontSize: '13px', color: '#444', margin: '0' }
const statIcon = { marginRight: '4px' }
const emptyState = { backgroundColor: '#f0ecea', borderRadius: '8px', padding: '24px', margin: '0 24px 20px', textAlign: 'center' as const }
const emptyText = { fontSize: '14px', color: '#888', margin: '0' }
const whatsappSection = { margin: '20px 24px 24px' }
const whatsappTitle = { fontSize: '13px', fontWeight: '600' as const, color: '#5F2558', margin: '0 0 8px' }
const whatsappBlock = { backgroundColor: '#DCF8C6', borderRadius: '8px', padding: '16px', border: '1px solid #c5e8a7' }
const whatsappContent = { fontSize: '13px', color: '#1a1a1a', margin: '0', whiteSpace: 'pre-wrap' as const, lineHeight: '1.6', fontFamily: 'monospace' }
const hr = { borderTop: '1px solid #f0ecea', margin: '0 24px', borderBottom: 'none', borderLeft: 'none', borderRight: 'none' }
const footer = { fontSize: '11px', color: '#999', margin: '16px 24px 24px' }

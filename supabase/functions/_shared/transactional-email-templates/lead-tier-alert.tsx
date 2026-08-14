import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Muti CRM'
const CRM_URL = 'https://crm.movimentocircular.io/admin/pipeline'

interface Overrides {
  title?: string
  subtitle?: string
  cta_text?: string
  footer?: string
}

interface Props {
  lead_id?: string
  lead_name?: string
  lead_email?: string
  lead_cargo?: string
  lead_telefone?: string
  lead_company?: string
  lead_origem?: string
  produto?: string
  tier?: number
  tier_reasoning?: string
  company_website?: string
  company_description?: string
  org_setor?: string
  org_segmento?: string
  org_porte?: string
  org_funcionarios?: string
  org_faturamento?: string
  org_cidade?: string
  org_uf?: string
  org_temas?: string[]
  overrides?: Overrides
}

const Row = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <Section style={dataRow}>
      <Text style={dataLabel}>{label}</Text>
      <Text style={dataValue}>{value}</Text>
    </Section>
  ) : null

const LeadTierAlertEmail = ({
  lead_id = '',
  lead_name = '',
  lead_email = '',
  lead_cargo = '',
  lead_telefone = '',
  lead_company = '',
  lead_origem = '',
  produto = '',
  tier = 1,
  tier_reasoning = '',
  company_website = '',
  company_description = '',
  org_setor = '',
  org_segmento = '',
  org_porte = '',
  org_funcionarios = '',
  org_faturamento = '',
  org_cidade = '',
  org_uf = '',
  org_temas = [],
  overrides = {},
}: Props) => {
  const ctaUrl = lead_id ? `${CRM_URL}?lead=${lead_id}` : CRM_URL
  const titleText = overrides.title || `Lead Tier ${tier} no pipeline`
  const subtitleText =
    overrides.subtitle ||
    `${lead_company || lead_name || 'Um novo lead'} entrou no CRM e foi classificado como prioridade alta pelo enriquecimento automático.`
  const ctaText = overrides.cta_text || 'Abrir lead no CRM'
  const footerText = overrides.footer || `${SITE_NAME} — Alerta automático de leads Tier 1 e 2`
  const local = [org_cidade, org_uf].filter(Boolean).join(' / ')

  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>{`Tier ${tier} — ${lead_company || lead_name}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerBar}>
            <Text style={headerTextStyle}>{`${SITE_NAME} · TIER ${tier}`}</Text>
          </Section>

          <Heading style={h1}>{titleText}</Heading>
          <Text style={subtitle}>{subtitleText}</Text>

          <Section style={cardContainer}>
            <Text style={cardTitle}>Contato</Text>
            <Row label="Nome" value={lead_name} />
            <Row label="Cargo" value={lead_cargo} />
            <Row label="Email" value={lead_email} />
            <Row label="Telefone" value={lead_telefone} />
            <Row label="Origem" value={lead_origem} />
            <Row label="Produto" value={produto} />
          </Section>

          <Section style={cardContainer}>
            <Text style={cardTitle}>Empresa</Text>
            <Row label="Empresa" value={lead_company} />
            <Row label="Setor" value={org_setor} />
            <Row label="Segmento" value={org_segmento} />
            <Row label="Porte" value={org_porte} />
            <Row label="Funcionários" value={org_funcionarios} />
            <Row label="Faturamento" value={org_faturamento} />
            <Row label="Localização" value={local} />
            {company_website ? (
              <Section style={dataRow}>
                <Text style={dataLabel}>Site</Text>
                <Link href={company_website} style={linkStyle}>{company_website}</Link>
              </Section>
            ) : null}
            {org_temas && org_temas.length > 0 ? (
              <Row label="Temas de interesse" value={org_temas.join(', ')} />
            ) : null}
          </Section>

          {company_description ? (
            <Section style={cardContainer}>
              <Text style={cardTitle}>Resumo enriquecido</Text>
              <Text style={paragraph}>{company_description}</Text>
            </Section>
          ) : null}

          {tier_reasoning ? (
            <Section style={cardContainer}>
              <Text style={cardTitle}>Por que Tier {tier}</Text>
              <Text style={paragraph}>{tier_reasoning}</Text>
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
  component: LeadTierAlertEmail,
  subject: (data: Record<string, any>) =>
    `Tier ${data.tier ?? 1} — ${data.lead_company || data.lead_name || 'Novo lead'}`,
  displayName: 'Alerta de lead Tier 1/2',
  previewData: {
    lead_id: 'abc-123',
    lead_name: 'Joana Silva',
    lead_email: 'joana@acmeverde.com',
    lead_cargo: 'Diretora de ESG',
    lead_telefone: '+55 11 98888-7777',
    lead_company: 'Acme Verde S.A.',
    lead_origem: 'Meta Ads',
    produto: 'Circular Experience',
    tier: 1,
    tier_reasoning: 'Multinacional com mais de 10 mil colaboradores globais.',
    company_website: 'https://acmeverde.com',
    company_description: 'Multinacional de bens de consumo com forte agenda de sustentabilidade.',
    org_setor: 'Bens de consumo',
    org_segmento: 'Alimentos e bebidas',
    org_porte: 'Grande',
    org_funcionarios: '10000+',
    org_faturamento: 'Acima de R$ 1 bi',
    org_cidade: 'São Paulo',
    org_uf: 'SP',
    org_temas: ['Economia circular', 'Embalagens'],
  },
  editableFields: {
    title: { label: 'Título', default: 'Lead Tier 1 no pipeline', placeholder: 'Lead Tier 1 no pipeline' },
    subtitle: { label: 'Subtítulo', default: 'Empresa entrou no CRM e foi classificada como prioridade alta pelo enriquecimento automático.', placeholder: 'Texto de abertura' },
    cta_text: { label: 'Texto do botão', default: 'Abrir lead no CRM', placeholder: 'Abrir lead no CRM' },
    footer: { label: 'Rodapé', default: 'Muti CRM — Alerta automático de leads Tier 1 e 2', placeholder: 'Muti CRM — Alerta...' },
  },
} satisfies TemplateEntry

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
const linkStyle = { fontSize: '13px', color: '#2FB2C0', fontWeight: '600' as const }
const paragraph = { fontSize: '13px', color: '#444', lineHeight: '1.6', margin: '0' }
const ctaContainer = { textAlign: 'center' as const, margin: '0 24px 24px' }
const ctaButton = { backgroundColor: '#2FB2C0', color: '#ffffff', padding: '14px 32px', borderRadius: '8px', fontSize: '15px', fontWeight: '600' as const, textDecoration: 'none', display: 'inline-block' }
const hr = { borderTop: '1px solid #f0ecea', margin: '0 24px', borderBottom: 'none', borderLeft: 'none', borderRight: 'none' }
const footer = { fontSize: '11px', color: '#999', margin: '16px 24px 24px' }

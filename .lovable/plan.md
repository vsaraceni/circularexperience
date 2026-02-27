

# Plano: Reposicionar Narrativa para B2B

## Resumo

Ajustar toda a comunicacao da landing page para o modelo B2B, com a headline atualizada conforme solicitado.

## Mudancas por Componente

### 1. Hero (`Hero.tsx`)
- **Headline:** "Abra as portas da sua organizacao para a **Economia Circular**"
- **Subheadline:** "Uma experiencia imersiva e pratica que capacita seu time a aplicar os principios da circularidade, gerando valor e inovacao para sua organizacao."
- **CTA principal:** "Solicitar Proposta"
- **Card "Ate 40":** label "Colaboradores", sublabel "Por edicao"

### 2. Header (`Header.tsx`)
- **Botao CTA:** "Solicitar Proposta" (desktop e mobile)

### 3. Stats (`Stats.tsx`)
- **Stat "83% dos pequenos empresarios...":** "Das empresas brasileiras ainda nao possuem estrategia de circularidade"

### 4. About (`About.tsx`)
- **Titulo:** "Capacite seu time para colocar a **Economia Circular** em pratica"
- **Objetivo:** Linguagem corporativa focada em equipes
- **CTA:** "Solicitar Proposta"
- **Box "A quem se destina?":** "Lideres, gestores, colaboradores, fornecedores, clientes que se conectam direta ou indiretamente com o tema mas que precisam compreender o seu papel na transicao para a circularidade."
- **Botao do box:** "Fale com Nossa Equipe"

### 5. Methodology (`Methodology.tsx`)
- **Subtitulo:** "Uma jornada em 3 etapas para capacitar sua equipe"
- **Step 3:** "para sua organizacao"
- **Titulo aprendizado:** "O que seu time vai aprender"

### 6. Agenda (`Agenda.tsx`)
- **Titulo:** "Agenda da Oficina"

### 7. Video (`Video.tsx`)
- **Subtitulo:** "como transformar sua organizacao"

### 8. CTA e LeadForm (`CTA.tsx` e `LeadForm.tsx`)
- **Badge:** "Solicite uma proposta"
- **Titulo:** "Leve o Circular Experience para sua empresa"
- **Novo campo:** "Cargo" com validacao Zod (min 2 chars)
- **Botao submit:** "Solicitar Proposta"
- **Pos-envio:** "Solicitacao Enviada!" com mensagem de proposta personalizada
- **Consentimento:** "receber uma proposta comercial do Circular Experience"

### 9. Edge Function (`send-lead-email/index.ts`)
- Subject: "Nova Solicitacao de Proposta: {name}"
- Adicionar campo "cargo" ao corpo do email

## Arquivos Afetados

| Arquivo | Alteracao |
|---|---|
| `src/components/landing/Hero.tsx` | Headline, subheadline, CTA, labels |
| `src/components/landing/Header.tsx` | Botao CTA |
| `src/components/landing/Stats.tsx` | Texto de stat |
| `src/components/landing/About.tsx` | Textos, publico-alvo, CTAs |
| `src/components/landing/Methodology.tsx` | Textos |
| `src/components/landing/Agenda.tsx` | Titulo |
| `src/components/landing/Video.tsx` | Subtitulo |
| `src/components/landing/CTA.tsx` | Textos |
| `src/components/landing/LeadForm.tsx` | Novo campo cargo, textos, botao |
| `supabase/functions/send-lead-email/index.ts` | Campo cargo, subject |


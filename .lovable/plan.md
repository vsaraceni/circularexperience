

## Corrigir Email Matinal — Replicar Missões do Dia

### Problemas identificados

1. **Conteúdo do email não reflete as Missões do Dia**: A edge function `check-notifications` usa critérios diferentes (SLA breach, follow-ups vencidos, leads parados 30min, propostas expirando) enquanto o banner Missões do Dia monitora: Novos, Follow-up (boas-vindas sem FU), Agendamento (em contato), Calls próximas, Briefings incompletos.

2. **Email vai para Spam/Promoções**: O domínio de envio é `contato@lovable.movimentocircular.io` via Resend, mas o domínio verificado no Lovable é `notify.escolas.movimentocircular.io`. Isso faz com que os emails tenham má reputação e caiam em abas secundárias do Gmail.

3. **Sem botão CTA**: O email atual não tem link para o CRM.

### Solução

Reescrever a lógica de digest na edge function `check-notifications` para replicar exatamente os 5 indicadores do banner Missões do Dia, migrar o envio para o sistema de email nativo do Lovable (domínio já verificado), e adicionar um botão CTA.

### O que muda

**1. Reescrever seções do digest (edge function `check-notifications`)**

Substituir as 4 seções atuais (SLA, follow-ups, stale, proposals) pelas 5 missões reais:
- **Novos** — leads em `kanban_stage = 'novo'`
- **Follow-up** — leads em `boas_vindas` com SLA vencido e sem follow-up pendente futuro
- **Agendamento** — leads em `em_contato`
- **Calls** — leads em `call_agendada` com `call_date` hoje ou amanhã
- **Briefing** — leads em `call_agendada` ou `proposta` sem `briefing_notes`

**2. Novo template HTML do email**

Replicar o visual compacto do banner com contadores coloridos (verde = 0, amarelo = poucos, vermelho = 3+), uma barra de progresso, e no final um botão "Vamos resolver isso!" linkando para `https://circularexperience.lovable.app/admin`.

Quando tudo estiver em dia: mensagem "Tudo em dia! 🎉" sem botão.

**3. Migrar envio para Lovable Email**

Substituir a chamada direta ao Resend pela infraestrutura nativa do Lovable (domínio `notify.escolas.movimentocircular.io` já verificado). Isso resolve o problema de deliverability/spam no Gmail.

Passos internos:
- Configurar infraestrutura de email (`setup_email_infra`)
- Criar template transacional de digest matinal
- Scaffold do `send-transactional-email`
- Alterar `check-notifications` para invocar `send-transactional-email` em vez de chamar Resend diretamente

**4. Manter cron existente**

O cron `check-notifications-hourly` (11h UTC = 8h BRT, seg-sex) continua igual — só muda o conteúdo e o método de envio.

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `supabase/functions/check-notifications/index.ts` | Reescrever lógica de digest + migrar envio |
| `supabase/functions/_shared/transactional-email-templates/daily-digest.tsx` | Criar template React Email |
| `supabase/functions/_shared/transactional-email-templates/registry.ts` | Registrar novo template |
| `supabase/functions/send-transactional-email/index.ts` | Scaffold (se não existir) |
| Página de unsubscribe (rota no app) | Criar (requisito do sistema de email) |


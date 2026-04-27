
## Parte 1 — Quick win: login do CRM vai direto para o Pipeline

Hoje há **3 lugares** apontando para `/admin/propostas` que precisam mudar para `/admin/pipeline`:

1. **`src/pages/Login.tsx` linha 37** — `emailRedirectTo` do magic link.
2. **`src/pages/Login.tsx` linha 58** — `navigate()` após login com senha bem-sucedido.
3. **`src/pages/Login.tsx` linha 73** — `redirect_uri` do Google OAuth.

Os redirects do `App.tsx` (root `/` e fallback `*` no `CrmRoutes`) **já apontam** para `/admin/pipeline` — então sessões já ativas que abrem `crm.movimentocircular.io` já caem no Pipeline. O ajuste no Login fecha o ciclo para logins novos.

**Sem mudanças** em: `Templates.tsx` (botão "voltar" do admin), `Products.tsx` (após salvar produto). Esses são fluxos contextuais onde "voltar para Propostas" faz sentido como destino histórico — mas se você preferir uniformizar tudo para Pipeline, pode incluir também (avise se quiser).

**Critério de aceite parte 1:**
- Login com Google, senha ou magic link → cai em `/admin/pipeline`.
- Sessão já ativa abrindo `crm.movimentocircular.io` → cai em `/admin/pipeline` (já funciona).

---

## Parte 2 — Separar CRM da Landing Page em projetos independentes

### Diagnóstico do acoplamento atual

O projeto hoje serve **duas aplicações** sob o mesmo build, com roteamento condicional por hostname em `App.tsx`:

```ts
const isCrmDomain = window.location.hostname.startsWith("crm.");
return isCrmDomain ? <CrmRoutes /> : <SiteRoutes />;
```

**O que é exclusivo da Landing** (vai sair do CRM):
- `src/pages/Index.tsx`, `src/pages/Unsubscribe.tsx`
- `src/components/landing/*` (15 arquivos)
- `src/components/presentation/*` (modo apresentação + slides) — usado também em `/apresentacao-print/:slug` que é gerado por edge function do CRM
- `src/components/pdf/PdfExporter.tsx`
- Edge functions: `webhook-meta-leads`, `handle-email-unsubscribe`, `send-meta-capi-event`, `send-welcome-email`
- Tabelas: `leads` (entrada), `email_suppressions`, `unsubscribes`

**O que é exclusivo do CRM** (fica no projeto novo):
- `src/pages/admin/*` (Pipeline, Propostas, Dashboard, Templates, etc.) + `src/pages/Login.tsx`
- `src/components/admin/*` (Kanban, LeadDrawer, ProposalForm, etc.)
- `src/hooks/use*` (notifications, follow-ups, dashboards)
- Edge functions: `check-notifications`, `enrich-lead`, `process-email-queue`, `send-bulk-email`, `send-lead-email`, `send-transactional-email`, `send-push-notification`, `export-proposals-leads`, `generate-pdf`
- Tabelas: `proposals`, `activities`, `follow_ups`, `notifications`, `message_templates`, `user_roles`, `profiles`

**Acoplamento crítico — `/apresentacao-print/:slug`:**
A edge function `generate-pdf` (CRM) faz fetch HTML de uma rota da landing (`circularexperience.lovable.app/apresentacao-print/:slug`). Se separarmos os projetos, **a rota de print precisa ficar acessível ao CRM** — ou via:
- (A) **manter** `/apresentacao-print` na Landing e o CRM continua chamando o domínio público, OU
- (B) **duplicar** a rota e seus slides no novo projeto CRM (custo: ~10 arquivos `presentation/`).

Recomendação: **opção A** — é uma página pública de leitura, sem regras de negócio do CRM, e mantém a landing como "fonte da verdade" das apresentações comerciais.

### Estratégia recomendada: Remix + poda em cada lado

A forma mais segura e rápida no Lovable:

**Passo 1 — Remix do projeto atual** (gera `circular-crm`, novo projeto independente)
- Mantém todo o histórico de código e migrações.
- **Mantém o mesmo backend Supabase** (Cloud) — leads escritos pelo webhook na landing continuam visíveis no CRM, sem ETL nem sincronização.
- Custom domain `crm.movimentocircular.io` migra para o projeto novo.

**Passo 2 — No projeto novo (`circular-crm`), remover o que é só landing:**
- Apagar `src/pages/Index.tsx`, `src/pages/Unsubscribe.tsx`, `src/components/landing/*`
- Apagar `src/components/presentation/*` (se opção A) — o CRM não precisa renderizar slides, só linkar
- Simplificar `App.tsx`: remover `isCrmDomain`, remover `<SiteRoutes>`, deixar só `<CrmRoutes>` com root `/` redirecionando para `/admin/pipeline`
- Remover edge functions exclusivas da landing (`webhook-meta-leads`, `handle-email-unsubscribe`, `send-meta-capi-event`, `send-welcome-email`) — **importante:** essas funções continuam ativas no projeto landing porque são referenciadas pelo Meta Ads e por links de unsubscribe em emails já enviados.

**Passo 3 — No projeto antigo (landing, `circularexperience`):**
- Apagar `src/pages/admin/*`, `src/pages/Login.tsx`, `src/components/admin/*`
- Apagar hooks de admin (`useNotifications`, `useFollowUps`, `useDailySnapshots`, `usePerformanceDashboard`, `useStrategicDashboard`, `usePushSubscription`, `useMessageTemplates`, `useAuth` se não for usado)
- Simplificar `App.tsx`: deixar só rotas de Index, Unsubscribe e `apresentacao-print`
- Remover edge functions exclusivas de admin (`check-notifications`, `process-email-queue`, `send-bulk-email`, etc.) — **manter** `generate-pdf` se ainda for chamada de algum lugar; checar referências antes de remover.
- Remover hostname routing — o domínio `circularexperience` e `experience.movimentocircular.io` servem só a landing.

**Passo 4 — Configurar domínios:**
- `crm.movimentocircular.io` → projeto **CRM novo** (mover Custom Domain via Settings)
- `experience.movimentocircular.io` + `circularexperience.lovable.app` → projeto **landing** (já está)
- `/apresentacao-print/:slug` continua funcionando em ambos enquanto ainda existir nos dois (seguro durante transição)

### Pontos de atenção

1. **Mesmo Supabase, dois clients gerados** — `src/integrations/supabase/types.ts` é regenerado por projeto pelo Lovable Cloud, mas como ambos apontam ao **mesmo backend**, os tipos serão idênticos. Sem risco de divergência.
2. **RLS já protege os dados** — não há vazamento de dados entre apps; a landing nunca pôde ler `proposals` mesmo no projeto unificado, então separar não muda a postura de segurança.
3. **Secrets** — secrets de edge functions (RESEND_API_KEY, GOOGLE keys, META_ACCESS_TOKEN, VAPID keys) são por **projeto Supabase**. Como o backend é compartilhado, não precisa duplicar.
4. **Edge functions duplicadas durante transição** — funções como `generate-pdf` podem coexistir nos dois projetos por um tempo (deploy do mais recente vence). Defina **um projeto canônico por função** após estabilizar.
5. **Sem dependências cruzadas de UI** — verifiquei: nenhum componente de `landing/` é importado por `admin/` ou vice-versa, exceto:
   - `src/pages/PrintablePresentation.tsx` (usado pelo CRM via `generate-pdf`) — fica na landing (opção A).
   - `LogoImage.tsx`, `NavLink.tsx` em `src/components/` — pequenos, copiar para ambos.

### Sequência de execução proposta (tarefas)

Esta parte (separação) é grande e envolve operações fora do código (criar remix, mover domínio). Sugiro fazer **em duas iterações**:

**Iteração A (agora, junto com a parte 1):**
- Implementar parte 1 (redirect de login → pipeline).

**Iteração B (depois, sob demanda):**
- Você cria o remix manualmente pelo dashboard Lovable (não consigo criar projetos novos por aqui).
- Você confirma o nome do novo projeto e me chama nele para a poda da landing/admin (passos 2 e 3 acima).
- Você move o custom domain `crm.movimentocircular.io` no painel Lovable.

### Critérios de aceite parte 2

- CRM e Landing rodam em projetos Lovable distintos, com builds independentes.
- Backend Supabase continua único e compartilhado (sem migração de dados).
- `crm.movimentocircular.io` serve só o CRM; `experience.movimentocircular.io` serve só a landing.
- Mudanças na landing não geram redeploy do CRM e vice-versa.
- `/apresentacao-print/:slug` segue funcionando para PDFs de proposta (mantido na landing).
- Nenhum link quebra: webhooks Meta, unsubscribe de emails, magic links de login.

---

## Arquivos impactados nesta iteração (parte 1 apenas)

- `src/pages/Login.tsx` — três strings `/admin/propostas` viram `/admin/pipeline`.

A parte 2 é planejamento/discussão; nenhuma alteração de código será feita agora para ela — aguardo seu OK e o remix criado para executar.

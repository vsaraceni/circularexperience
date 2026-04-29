## Remover Landing Page do CRM

Atualmente o `App.tsx` tem dois conjuntos de rotas (`CrmRoutes` e `SiteRoutes`) escolhidos por hostname. Como o CRM agora vive exclusivamente em `crm.movimentocircular.io` e a landing page existe em outro projeto, vamos simplificar tudo para usar apenas as rotas do CRM.

### Mudanças

**`src/App.tsx`**
- Remover detecção de hostname (`isCrmDomain`).
- Remover `SiteRoutes` por completo.
- Remover imports não usados: `Index`, `NotFound`, `Unsubscribe`, `PresentationMode` (se só era usado via Index).
- Manter apenas as rotas do CRM, com `/` redirecionando para `/login` (em vez de `/admin/pipeline`), garantindo que a home seja sempre o login. O `ProtectedRoute` já redireciona usuários autenticados a partir do login, mas para manter a regra "home = login sempre", a raiz aponta para `/login`.
- Rotas finais: `/` → `/login`, `/login`, `/admin/pipeline`, `/admin/propostas`, `/admin/dashboard`, `/admin/templates`, `/admin/performance`, `/painel`, `/admin/produtos`, `/admin/integracoes`, `/apresentacao-print/:slug`, `*` → `/login`.

**Arquivos a deletar (não mais referenciados):**
- `src/pages/Index.tsx`
- `src/pages/NotFound.tsx`
- `src/pages/Unsubscribe.tsx`
- `src/components/landing/` (pasta inteira: Header, Hero, About, Agenda, CTA, Experts, FAQSection, Footer, LeadForm, Methodology, SDGs, SocialProof, Stats, Testimonial, Video)

**Manter (ainda usados pelo CRM):**
- `src/components/presentation/` — usado em `PrintablePresentation` e nas propostas.
- `src/components/pdf/PdfExporter.tsx` — usado em propostas.

### Verificações antes de deletar
Antes de remover arquivos, faço um `rg` para confirmar que nada em `src/components/admin/`, `src/pages/admin/`, hooks ou edge functions importa de `@/components/landing/` ou das páginas removidas. Se houver alguma referência inesperada, ajusto antes de deletar.

### Resultado
- Acessar `crm.movimentocircular.io/` leva direto ao login.
- Sem código de landing page no repo do CRM, reduzindo bundle e ambiguidade.

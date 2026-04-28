## Painel de Integrações de Leads

Criar uma UI dentro do CRM para gerenciar as fontes de leads (`lead_sources`) que hoje só existem no banco. Permite cadastrar novos canais (LPs, formulários externos, parceiros) sem precisar de migration manual.

**Decisões aprovadas:**
- Localização: **Admin → Integrações** (item novo na navbar admin)
- Acesso: **Apenas admin**
- Rotação de chave: **Período de graça de 24h** (chave antiga continua válida até expirar)

---

### 1. Mudanças no banco

**Tabela `lead_sources`** — adicionar colunas para suportar rotação com graça:
- `previous_api_key_hash text` — hash da chave anterior (nullable)
- `previous_api_key_prefix text` — prefixo anterior (nullable)
- `previous_api_key_expires_at timestamptz` — quando a chave antiga deixa de funcionar (nullable)

RLS já está OK (`is_admin(auth.uid())` cobre tudo). Sem mudanças em policies.

**`authenticateApiKey` (edge `_shared/auth.ts`)** — ampliar lookup para também tentar `previous_api_key_prefix` quando o prefixo bater e `previous_api_key_expires_at > now()`. Se a chave antiga for usada, logar em `lead_ingest_log` com flag `using_grace_key: true` no payload do erro/contexto (apenas observabilidade).

---

### 2. Página `/admin/integracoes`

**Rota protegida** com `<ProtectedRoute requireAdmin>` no `App.tsx`.

**Item de menu** em `CrmNavbar.tsx`, visível apenas para admin (já existe lógica `isAdmin`). Ícone: `Plug` (lucide).

**Layout da página:**

```text
┌─────────────────────────────────────────────────────────┐
│ Integrações                          [+ Nova Integração]│
│ Gerencie canais que enviam leads para o CRM             │
├─────────────────────────────────────────────────────────┤
│ ┌─ Card: Landing Page Circular Experience ───────────┐ │
│ │ slug: lp_ce              [● Ativo]  [Como integrar]│ │
│ │ Chave: pk_lpce_OZ0...WJ  Criada há 2h              │ │
│ │ CORS: experience.movimentocircular.io              │ │
│ │ Rate limit: 30/min  ·  Leads recebidos: 12         │ │
│ │ [Editar] [Rotacionar chave] [Desativar]            │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌─ Card: Webhook Meta Ads ───────────────────────────┐ │
│ │ ...                                                 │ │
│ └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Componentes:**
- `IntegrationsList.tsx` — lista os cards de fontes
- `IntegrationCard.tsx` — card de cada fonte (status, métricas, ações)
- `IntegrationFormDialog.tsx` — Dialog de criar/editar (slug, nome, CORS multi-input, rate limit, default_stage, default_assignee, email_notificar, capi_habilitado, custom_field_schema como JSON textarea)
- `IntegrationKeyDialog.tsx` — exibe a chave gerada **uma única vez** com botão copiar e aviso "guarde agora, não poderemos mostrar novamente"
- `IntegrationGuideDialog.tsx` — modal "Como integrar" com aba **cURL** e aba **JavaScript** (snippet pronto, com a chave preenchida e instruções resumidas)
- `RotateKeyDialog.tsx` — confirma rotação, mostra contador "chave antiga válida até [data+24h]"

---

### 3. Edge Function `manage-lead-source`

Nova function (`verify_jwt = true`, valida admin no código) que centraliza operações sensíveis:

- `POST /create` — gera `pk_<slug>_<random32>`, salva bcrypt hash, retorna chave em texto puro **uma única vez**
- `POST /rotate` — gera nova chave, move atual para `previous_api_key_*` com expiração `now() + 24h`, retorna nova chave
- `POST /update` — atualiza campos não-sensíveis (nome, CORS, rate, etc.) — pode ser feito via supabase client direto também, mas centralizamos por consistência

Por que edge e não client direto: bcrypt não roda no browser e a geração de chave precisa ser server-side para garantir entropia.

Operações de leitura (listar fontes, métricas) vão direto via supabase client (já protegido por RLS admin).

---

### 4. Métricas por fonte

No card, mostrar contadores rápidos consultando `lead_ingest_log`:
- Leads recebidos (últimos 7 dias)
- Última recepção (relative time)
- Taxa de erro (status != 'created' / total)

Query simples agrupada por `source_slug`.

---

### 5. Guia "Como integrar" (modal)

Conteúdo dinâmico baseado na fonte selecionada, com snippets prontos:

**Aba cURL:**
```bash
curl -X POST https://gxqrmxhpltfkkhhtqvmh.supabase.co/functions/v1/ingest-lead \
  -H "Content-Type: application/json" \
  -H "x-api-key: <CHAVE_DA_FONTE>" \
  -d '{"source":"<slug>","name":"...","email":"..."}'
```

**Aba JavaScript:** snippet de fetch com captura de UTM básica.

**Aba Campos:** lista campos aceitos (name, email, phone, company, cargo, utm.*, custom_fields) e o `custom_field_schema` da fonte se preenchido.

Botão "Baixar guia completo (.md)" gera o markdown equivalente ao `integracao-crm-muti.md` parametrizado pela fonte.

---

### 6. Detalhes técnicos

**Geração de chave:** `pk_<slug_curto>_<32_chars_base64url>` no edge usando `crypto.getRandomValues`. Slug curto = primeiros 6 chars do slug sanitizado.

**bcrypt:** mesma lib já usada em `_shared/auth.ts` (`deno.land/x/bcrypt@v0.4.1`), `hashSync` com cost 10.

**Validação de slug:** regex `^[a-z0-9_]{3,32}$`, único na tabela.

**CORS input:** componente de tags (cada Enter adiciona um domínio), validação `https?://...` ou `*` para liberar tudo (com warning visual).

**Lógica de graça no auth:**
```ts
// Tenta chave atual
for (const c of candidates) if (compareSync(rawKey, c.api_key_hash)) return c;
// Tenta chave anterior se ainda válida
const graceCandidates = await supabase.from('lead_sources')
  .select('...').eq('previous_api_key_prefix', prefix)
  .gt('previous_api_key_expires_at', new Date().toISOString());
for (const c of graceCandidates) if (compareSync(rawKey, c.previous_api_key_hash)) return c;
```

---

### 7. Arquivos a criar/editar

**Criar:**
- `supabase/migrations/<ts>_lead_sources_grace_period.sql`
- `supabase/functions/manage-lead-source/index.ts`
- `src/pages/admin/Integrations.tsx`
- `src/components/admin/integrations/IntegrationsList.tsx`
- `src/components/admin/integrations/IntegrationCard.tsx`
- `src/components/admin/integrations/IntegrationFormDialog.tsx`
- `src/components/admin/integrations/IntegrationKeyDialog.tsx`
- `src/components/admin/integrations/IntegrationGuideDialog.tsx`
- `src/components/admin/integrations/RotateKeyDialog.tsx`
- `src/hooks/useLeadSources.ts`

**Editar:**
- `src/App.tsx` — rota `/admin/integracoes`
- `src/components/admin/CrmNavbar.tsx` — item de menu (admin only)
- `supabase/functions/_shared/auth.ts` — suporte a chave de graça
- Memória do projeto — adicionar `mem://crm/integrations-management`

---

### Fora de escopo (fica para depois)
- Dashboard analítico avançado por fonte (conversão por canal, CAC)
- Webhooks de saída (notificar sistema externo quando lead muda de stage)
- Templates de guia para outros canais (Typeform, RD, HubSpot) — começamos só com cURL/JS genéricos

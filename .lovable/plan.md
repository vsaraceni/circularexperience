

## Evolução Notificações — Email matinal + Web Push (Service Worker)

### Parte 1: Email matinal consolidado

**Edge Function: `check-notifications/index.ts`**

- Aceitar `mode` no body: `"digest"` | `"realtime"` (default `"realtime"`)
- **`realtime`** (cada 15min): cria notificações in-app, NÃO envia email
- **`digest`** (8h BRT): coleta todas as pendências, monta 1 email HTML consolidado por admin com seções (SLA Crítico, Follow-ups, Leads parados, Propostas expirando), envia via Resend
- Email de novo lead (send-lead-email) continua imediato — sem mudança

**Cron jobs (SQL)**:
- Atualizar job `*/15` para enviar `body: '{"mode":"realtime"}'`
- Atualizar job hourly para schedule `0 11 * * 1-5` (8h BRT) com `body: '{"mode":"digest"}'`

### Parte 2: Web Push — Service Worker + Push API

**Infraestrutura necessária:**

1. **VAPID keys** — Gerar par de chaves (pública/privada). Pública vai no frontend, privada como secret na edge function
2. **Tabela `push_subscriptions`** — `id, user_id, endpoint, p256dh, auth, created_at` com RLS para o próprio usuário
3. **Service Worker** (`public/sw.js`) — Escuta evento `push`, exibe `self.registration.showNotification()` com título/body/ícone. Escuta `notificationclick` para abrir/focar a aba do CRM
4. **Edge Function: `send-push-notification`** — Recebe `user_id`, `title`, `body`. Busca subscriptions do user, envia via Web Push protocol (biblioteca `web-push` para Deno)
5. **DB trigger em `notifications` INSERT** — Chama `send-push-notification` para cada notificação criada, garantindo push em todos os cenários (realtime, digest, novo lead)

**Frontend:**

6. **`useNotifications.ts`** — Ao inicializar, verificar `'serviceWorker' in navigator && 'PushManager' in window`. Se suportado, registrar SW e solicitar permissão
7. **`NotificationBell.tsx`** — Botão "Ativar notificações" quando permissão não concedida. Status visual (🔔 ativo / 🔕 inativo)
8. **Hook `usePushSubscription`** — Gerencia subscribe/unsubscribe, salva subscription no DB via Supabase

**Guarda para preview Lovable:**
- Service worker NÃO registra em iframes nem em hosts `id-preview--` (conforme diretriz PWA)
- Push só funciona na versão publicada

### Fluxo completo

```text
Novo lead chega → send-lead-email (email imediato) ✓
                → trigger notify_new_lead → INSERT notifications
                → trigger send-push-notification → Web Push ao admin
                → Realtime channel → som + toast + badge aba

A cada 15min   → check-notifications(realtime) → INSERT notifications (sem email)
                → trigger send-push-notification → Web Push
                → Realtime → som + toast

8h BRT (seg-sex) → check-notifications(digest) → INSERT notifications + 1 email consolidado
                  → trigger send-push-notification → Web Push
```

### Resumo de mudanças

| Recurso | Mudança |
|---------|---------|
| `check-notifications/index.ts` | Aceitar `mode`, template digest HTML, condicionar email |
| Cron jobs (SQL) | Ajustar schedules e payloads |
| Nova tabela `push_subscriptions` | Armazenar subscriptions por usuário |
| `public/sw.js` | Service worker para push events |
| Nova edge function `send-push-notification` | Enviar web push via VAPID |
| Novo trigger em `notifications` | Chamar push function em cada INSERT |
| `useNotifications.ts` | Registrar SW, solicitar permissão |
| `NotificationBell.tsx` | Botão ativar notificações |
| Novo hook `usePushSubscription.ts` | Gerenciar subscription no DB |
| Secrets | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` |

### Limitações

- Push funciona apenas na versão publicada (não no preview do editor)
- Safari iOS requer que o site seja adicionado à Home Screen (PWA) para push
- O usuário precisa aceitar permissão do browser uma vez


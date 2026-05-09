## Objetivo

Transformar o atual `WhatsAppPanel` (que hoje só mostra métricas agregadas) num **painel de controle dedicado por fonte**, onde o admin liga/desliga o disparo via GPT Maker para cada `lead_source` em 1 clique, sem abrir o dialog de edição. Configurações avançadas (channel, agent, mensagem inicial) seguem no botão "Editar fonte".

## Onde

Topo de `/admin/integracoes`, expandindo o componente `src/components/admin/integrations/WhatsAppPanel.tsx`. Continua usando o mesmo `useLeadSources` que já alimenta a página.

## Layout proposto

```text
┌─ WhatsApp via GPT Maker ─────────── [Configurado] ──┐
│  Disparo automático por fonte. Idempotência 24h.    │
│                                                     │
│  [Enviados 7d: 6]  [Erros 7d: 1]  [Ignorados: 12]   │
│                                                     │
│  ── Habilitar por fonte ─────────────────────────── │
│  Fonte           Status   Canal/Agente   Envios 7d  │
│  ─────────────────────────────────────────────────  │
│  LP Circular     [● ON]   default        4 / 0 err  │
│  Meta Ads CE     [○ OFF]  —              0 / 0 err  │
│  LP Workshop     [● ON]   ag_xyz         2 / 1 err  │
│  ...                                                │
│                                                     │
│  [Ver últimos envios]                               │
└─────────────────────────────────────────────────────┘
```

## Funcionalidades

1. **Toggle por fonte** (`Switch` shadcn): chama `manage-lead-source/update` com `{ id, whatsapp_auto_send: !current }`. Otimista + revert em caso de erro. Toast de sucesso/erro.
2. **Aviso de pré-requisito**: se a fonte não tem `whatsapp_initial_message` nem channel/agent customizado, ainda permite ligar (usa defaults globais), mas mostra um pequeno ícone de info ao lado do toggle com tooltip "Usando mensagem e canal padrão".
3. **Métricas por fonte (7d)**: agrupa `whatsapp_send_log` por `source_slug` para exibir envios e erros por linha. Reaproveita o `metrics` já em `useLeadSources` (que tem `total_7d`/`errors_7d` agregado de leads) — para ser preciso, faz uma query adicional única em `whatsapp_send_log` agrupada por `source_slug` na carga do painel.
4. **Linha por fonte**: nome + slug, status (ON/OFF), resumo do que está customizado (badge "msg custom", "agente custom", "canal custom"), envios/erros 7d, link "Editar" que abre o `IntegrationFormDialog` da fonte (reusa o estado da página via prop callback `onEditSource`).
5. **Filtro**: só lista fontes com `ativo = true` (oculta integrações desativadas para reduzir ruído). Toggle "Mostrar inativas" se necessário.
6. **Modal de logs**: mantém o existente "Ver últimos envios" inalterado.

## Mudanças técnicas

### `src/pages/admin/Integrations.tsx`
- Passar `sources` e callback `onEditSource={(s) => { setEditing(s); setFormOpen(true); }}` para `<WhatsAppPanel />`.
- Sem outras mudanças nos cards inferiores (mantêm o badge "WhatsApp auto" como indicador visual).

### `src/components/admin/integrations/WhatsAppPanel.tsx`
- Aceitar props `sources: LeadSourceRow[]` e `onEditSource: (s) => void`.
- Adicionar query agrupada: `select source_slug, status, count(*) ... from whatsapp_send_log where created_at >= 7d group by source_slug, status`. Mapear pra `Record<slug, { sent, errors }>`.
- Render da tabela de fontes com `Switch` (shadcn) por linha.
- Função `toggleSource(s)` chamando `supabase.functions.invoke('manage-lead-source/update', { body: { id, whatsapp_auto_send } })` com refresh local + propagação via `onToggled` (que chama `refresh()` da página).

### Backend
- **Sem mudanças**. A edge function `manage-lead-source/update` já aceita `whatsapp_auto_send`. RLS atual em `lead_sources` (`is_admin`) já protege.

## Fora do escopo
- Editar mensagem/canal/agente inline (continua no dialog Editar fonte, conforme decidido).
- Botão "enviar teste" — pode ser um próximo passo se quiser validar antes de ativar.
- Alertas de erro (já discutido em outro ciclo).

## Validação pós-implementação
1. Abrir `/admin/integracoes` → painel topo lista todas as fontes ativas com switch refletindo `whatsapp_auto_send`.
2. Toggle OFF→ON em uma fonte: badge "WhatsApp auto" aparece no card abaixo, e novo lead daquela fonte dispara WhatsApp.
3. Toggle ON→OFF: novo lead da fonte vai para `whatsapp_send_log` com `status='skipped_disabled'` (ou nem registra, dependendo da lógica em `ingest-lead`).
4. Métricas por fonte batem com filtro do log agrupado.

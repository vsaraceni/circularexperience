## Objetivo

Hoje todo lead vindo de Meta Lead Ads entra no CRM com `origem = "meta_ads"` (uma única fonte com `produto_label` fixo). Isso impede distinguir entre Circular Experience e o novo Conexão Circular — tanto no CRM quanto na mensagem inicial do GPT Maker, onde a variável `{{produto}}` sai sempre igual.

A proposta é tratar **cada produto como uma fonte Meta Ads própria**, decidida pelo `campaign_id` que o webhook do Meta já recebe. Nada na operação atual de CE precisa mudar de comportamento — só ganha um "irmão" para o segundo produto.

## O que já temos (não precisa refazer)

- `lead_sources` com `slug`, `produto_label`, `whatsapp_channel_id`, `whatsapp_agent_id`, `whatsapp_initial_message`, `default_assignee`, `whatsapp_auto_send`, `default_stage`.
- `leads.origem`, `leads.campaign_id`, `leads.ad_id`, `leads.utm_campaign`.
- Trigger `trigger_whatsapp_gptmaker` que dispara `send-whatsapp-gptmaker` quando `origem` aponta para uma `lead_sources` ativa com `whatsapp_auto_send = true`.
- Edge function `send-whatsapp-gptmaker` que já usa `produto_label` e substitui `{{produto}}`, `{{campanha}}`, `{{primeiro_nome}}` etc. na mensagem.
- Webhook `webhook-meta-leads` que já lê `campaign_id`, `adset_id`, `ad_id` e `form_id` do Meta.
- Tabela `products` com Circular Experience, Circular Day, Circular Week (Conexão Circular ainda não está cadastrado).

## O que falta

1. **Não existe vínculo entre `lead_sources` e `products`** — `produto_label` é texto livre, fácil de digitar errado e impossível de filtrar por produto nos dashboards.
2. **Não existe mapeamento `campaign_id → produto/fonte`**: o webhook não sabe qual produto a campanha do Meta representa, então cai sempre em `meta_ads`.
3. **Sem `product_id` no lead**, dashboards (Estratégico, Performance) não conseguem segmentar por produto.

## Plano

### 1. Schema (migração)

- Adicionar coluna `product_id uuid REFERENCES public.products(id)` em `lead_sources` (nullable). Indica que aquela fonte pertence a um produto específico.
- Adicionar coluna `product_id uuid REFERENCES public.products(id)` em `leads` (nullable, com índice). Preenchido no momento da ingestão a partir da fonte resolvida.
- Criar tabela `public.meta_campaign_product_map`:
  - `campaign_id text PRIMARY KEY` (id da campanha no Meta)
  - `lead_source_id uuid NOT NULL REFERENCES public.lead_sources(id)`
  - `product_id uuid REFERENCES public.products(id)`
  - `label text` (nome amigável para o admin)
  - `created_at`, `updated_at`
  - GRANTs + RLS: leitura/escrita só para `admin` via `has_role`; `service_role` total (usado pelo webhook).
- Inserir Conexão Circular em `products` se ainda não existir.

### 2. Lead sources por produto

Criar (via UI Integrações, ou seed) duas fontes Meta:

- `meta_ads_circular_experience` — `produto_label = "Circular Experience"`, `product_id` = id do CE, `whatsapp_initial_message` específica do CE, `whatsapp_agent_id`/`channel_id` herdados do que já roda hoje.
- `meta_ads_conexao_circular` — `produto_label = "Conexão Circular"`, `product_id` do novo produto, mensagem inicial e agente próprios (mesmo agente serve, se o admin quiser — é configurável).

A fonte legada `meta_ads` continua existindo para não quebrar leads históricos, mas vira **fallback** (sem `product_id`). Novas campanhas devem estar no mapeamento.

### 3. Webhook `webhook-meta-leads`

No momento da inserção do lead:

1. Ler `campaign_id` do evento.
2. Consultar `meta_campaign_product_map` por `campaign_id`.
3. Se encontrar: usar o `slug` da `lead_sources` referenciada como `leads.origem` e gravar `leads.product_id` correspondente.
4. Se **não** encontrar: cair em `origem = "meta_ads"` (comportamento atual) e logar em `lead_ingest_log` um alerta `unmapped_meta_campaign` com o `campaign_id`, para o admin cadastrar depois.

Isso preserva 100% do fluxo atual de CE assim que o `campaign_id` dele estiver mapeado para `meta_ads_circular_experience`.

### 4. Trigger e edge function de WhatsApp

Nenhuma mudança de lógica: o trigger já casa `leads.origem` com `lead_sources.slug` e respeita `whatsapp_auto_send`. A função `send-whatsapp-gptmaker` já lê `produto_label` e `whatsapp_initial_message` da fonte. Como cada produto agora terá fonte própria, a variável `{{produto}}` e a mensagem inicial sairão corretas automaticamente — o agente do GPT Maker recebe "Circular Experience" ou "Conexão Circular" sem código novo.

Pequeno ajuste opcional na função: incluir `product_id` no `metadata` da atividade `whatsapp_iniciado` para rastreio.

### 5. Painel de Integrações (admin)

Adicionar, dentro da página de Integrações já existente:

- Na edição de cada `lead_source`: campo "Produto" (select de `products`) que grava `product_id`.
- Nova aba "Campanhas Meta": CRUD da tabela `meta_campaign_product_map` (campaign_id + fonte Meta + label). Mostrar, ao lado, lista dos `campaign_id` recentes vistos em `leads` que ainda não estão mapeados, com botão "mapear".

### 6. Dashboards e filtros

- No filtro global do Kanban/Toolbar e nos dashboards Estratégico e Performance, adicionar filtro por **Produto** (usa `leads.product_id`, com fallback para `lead_sources.product_id` via join quando `product_id` do lead estiver nulo em registros antigos).
- Backfill simples: `UPDATE leads SET product_id = ls.product_id FROM lead_sources ls WHERE leads.origem = ls.slug AND leads.product_id IS NULL` rodando uma vez após a migração.

### 7. Validação

- Testar webhook com payload simulando `campaign_id` mapeado e não-mapeado.
- Inserir lead manual com `origem = meta_ads_conexao_circular` e confirmar: (a) `product_id` preenchido, (b) trigger dispara, (c) mensagem WhatsApp chega com `{{produto}} = "Conexão Circular"`, (d) atividade `whatsapp_iniciado` registrada.
- Conferir que leads históricos com `origem = meta_ads` continuam funcionando.

## Detalhes técnicos resumidos

```text
products ──┐
           │ product_id
lead_sources ──┐ slug, produto_label, whatsapp_*
               │
meta_campaign_product_map (campaign_id → lead_source_id, product_id)
               │
webhook-meta-leads ──► resolve(campaign_id) ──► leads.origem = source.slug
                                               leads.product_id = source.product_id
                                               │
                                  trigger_whatsapp_gptmaker (já existe)
                                               │
                                  send-whatsapp-gptmaker (já usa produto_label)
                                               │
                                  GPT Maker recebe mensagem com {{produto}} correto
```

Itens novos a criar: 1 migração, 1 tabela de mapeamento, ajustes no `webhook-meta-leads`, telas de admin em Integrações, filtro de produto nos dashboards, backfill. Itens **não** alterados em lógica: trigger de WhatsApp, edge function `send-whatsapp-gptmaker`, fluxos de CAPI e enrich.

# Roteamento Multi-Produto no GPT Maker (1 número, N agentes)

## Como o GPT Maker realmente funciona

Pesquisei a doc oficial e confirmei a regra do jogo:

- **Canal = 1 número de WhatsApp**, sempre amarrado a **1 agente** por vez (o "agente do canal").
- O endpoint que usamos hoje, `POST /v2/channel/{channelId}/start-conversation`, só aceita `{ phone, message }` — ele dispara via o número do canal e quem responde é o agente bound ao canal. **Não dá pra passar `agentId` nesse endpoint.**
- Existe `POST /v2/agent/{agentId}/conversation`, mas ele é chat via API (não entrega no WhatsApp do lead) — não serve pro nosso caso.
- Existe `POST /v2/agent/{agentId}/add-message` (Adicionar contexto) — injeta uma mensagem no contexto da conversa de um agente, identificada por `contextId`.
- Existem **Transfer Rules** por agente (`/v2/agent/{agentId}/transfer-rules`) que permitem um agente transferir para outro agente (`type: AGENT`) ou pra humano.

Conclusão: **não dá pra ter "1 canal por produto" sem ter N números**. O caminho profissional é **1 canal + 1 agente de triagem que transfere pro agente correto**, usando contexto injetado por nós antes do start-conversation.

## Arquitetura proposta

```text
Meta Lead Ads ──> Webhook CRM ──> Lead criado (origem=meta_ads_X, product_id=Y)
                                          │
                                          ▼
                     trigger_whatsapp_gptmaker → send-whatsapp-gptmaker
                                          │
                ┌─────────────────────────┼─────────────────────────┐
                ▼                         ▼                         ▼
   1) add-context no Agente         2) start-conversation       3) Agente Triagem
      Triagem (contextId=phone)        no Canal único              recebe lead,
      "Lead novo: produto                                          lê contexto,
       Conexão Circular,                                           transfere via
       empresa X, campanha Y"                                      regra para o
                                                                   agente do produto
```

**Componentes:**

1. **1 canal WhatsApp** (o número atual) bound a um novo **Agente de Triagem**.
2. **2 agentes de produto** (os que você já criou): Conexão Circular e Circular Experience.
3. **Transfer rules** no Agente de Triagem:
   - Regra "Conexão Circular" → `type: AGENT`, `agentId = <ID do agente Conexão Circular>`
   - Regra "Circular Experience" → `type: AGENT`, `agentId = <ID do agente Circular Experience>`
4. **Mensagem inicial** da fonte continua sendo a do produto (já temos isso por fonte).
5. **Tag de produto** injetada via `add-message` antes do `start-conversation`, com `role: 'user'` ou `'assistant'`, dizendo algo como: `[PRODUTO: Conexão Circular] [CAMPANHA: Edição 2] Lead novo via Meta Lead Ads`. O agente de triagem é treinado pra ler essa tag e disparar a transfer-rule certa.

## O que muda no CRM

### Banco

Nova migration em `lead_sources`:
- `whatsapp_agent_id` deixa de representar "agente bound ao canal" e passa a representar **"agente-alvo da transferência"** (não muda o tipo, muda o significado).
- Continua opcional `whatsapp_channel_id` por fonte (caso no futuro alguém realmente tenha um número dedicado).
- Sem novos campos por enquanto.

Novo secret runtime: `GPTMAKER_TRIAGEM_AGENT_ID` (ID do agente de triagem). Mantemos `GPTMAKER_CHANNEL_ID` como o canal único.

### Edge function `send-whatsapp-gptmaker`

Sequência nova (em uma única chamada do trigger):

1. Buscar lead + fonte (já faz).
2. Resolver `triagemAgentId = lead_source.whatsapp_triagem_agent_id ?? env.GPTMAKER_TRIAGEM_AGENT_ID`.
3. Resolver `targetAgentId = lead_source.whatsapp_agent_id` (o agente final do produto).
4. Resolver `channelId` (mantém: fonte → env padrão).
5. **Passo novo A — `add-message`** no agente de triagem:
   ```text
   POST /v2/agent/{triagemAgentId}/add-message
   { contextId: phone, role: 'user', prompt: '[PRODUTO: <produto_label>] [CAMPANHA: <campanha>] [FONTE: <slug>] [AGENT_TARGET_ID: <targetAgentId>] Lead novo recebido via CRM' }
   ```
   Isso planta no histórico do contato a informação que a triagem precisa.
6. **Passo B — `start-conversation`** no canal (igual hoje, com a mensagem inicial específica do produto).
7. Logar tudo em `whatsapp_send_log` (`gptmaker_response` passa a guardar também o resultado do `add-message`).

Idempotência 24h continua igual.

### Treinamento do Agente de Triagem (você faz no GPT Maker)

Prompt do agente de triagem precisa:
- Detectar a tag `[PRODUTO: ...]` na primeira mensagem de contexto.
- Disparar a transfer-rule correspondente (`Conexão Circular` ou `Circular Experience`).
- Não responder ao lead diretamente — só transferir.

Você cria isso uma vez na UI do GPT Maker. Eu te entrego o texto de treinamento pronto pra colar.

### UI Admin (`/admin/integracoes`)

Pequeno ajuste no formulário/edição de fonte:
- Renomear label "WhatsApp Channel ID" → "WhatsApp Channel ID (opcional, override)" com ajuda explicando que normalmente fica vazio.
- Renomear "WhatsApp Agent ID" → "Agente-alvo no GPT Maker (transferência)" com ajuda dizendo que esse é o agente que assume após a triagem.
- Adicionar campo opcional "Agente de Triagem (override)" — quase sempre vazio, usa o do env.

## Plano de execução (3 entregas)

### Entrega 1 — Migration + ajuste de label
- Sem mudança estrutural pesada; só comentário/label nos campos existentes.
- Adicionar coluna opcional `whatsapp_triagem_agent_id text null` em `lead_sources` (override raro).

### Entrega 2 — Edge function
- Adicionar chamada `add-message` antes do `start-conversation` em `send-whatsapp-gptmaker/index.ts`.
- Atualizar log pra incluir resultado do `add-message`.
- Erro no `add-message` é não-fatal (loga, segue pro `start-conversation`).

### Entrega 3 — UI Admin
- Atualizar labels e tooltips no `IntegrationFormDialog`.
- Adicionar campo "Agente de Triagem (override)" opcional.

### Tarefas que ficam pra você no GPT Maker
1. Criar o **Agente de Triagem** (ou reaproveitar um agente neutro).
2. Vincular o canal único do número atual ao Agente de Triagem (`edit-channel`).
3. Criar 2 **transfer-rules** no Agente de Triagem (uma pra cada agente de produto).
4. Me passar:
   - `agentId` do agente de triagem → vai no secret `GPTMAKER_TRIAGEM_AGENT_ID`.
   - `agentId` do agente Conexão Circular (atualiza o `whatsapp_agent_id` da fonte `meta_ads_conexao_circular`).
   - `agentId` do agente Circular Experience (atualiza o `whatsapp_agent_id` da fonte `meta_ads_circular_experience`).

## Pontos pra você confirmar antes de eu codar

1. **Você topa criar um Agente de Triagem dedicado** ou prefere usar 1 dos 2 agentes existentes acumulando função de triagem + atendimento? (Triagem dedicada é mais limpo e escalável quando entrarem mais produtos.)
2. **As transfer-rules da GPT Maker são acionadas por instrução do prompt do agente** (você descreve no treinamento "se vier `[PRODUTO: X]`, transfira pra regra Y"). Confirma que está confortável em treinar o agente de triagem por prompt, ou prefere que eu sugira o texto pronto?
3. Esse plano dispara mensagem normalmente pelo mesmo número que vocês já usam hoje — **nenhuma necessidade de novo número WhatsApp**. Está OK?

Depois que você confirmar, executo as 3 entregas.

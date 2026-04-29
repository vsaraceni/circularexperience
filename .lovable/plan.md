## Diagnóstico

A documentação oficial (`POST /v2/channel/{channelId}/start-conversation`) é categórica em dois pontos que explicam exatamente o sintoma "GPT Maker responde `success: true`, abre thread no painel, mas o lead não recebe nada no WhatsApp":

1. **Payload aceito é apenas `{ phone, message }`.** Hoje nossa edge function envia também `name`, `metadata`, `agentId` e `contact`. A API ignora silenciosamente esses campos extras (por isso o `success: true`), mas isso indica que o request está sendo aceito como genérico — não como o fluxo esperado.

2. **Restrição crítica:** *"iniciar a conversa só está disponível para canais do tipo Whatsapp **não oficial**"*. Se o `GPTMAKER_CHANNEL_ID` configurado for um canal **WhatsApp Cloud API (oficial / Meta)**, o endpoint retorna sucesso na criação da thread, mas o WhatsApp da Meta bloqueia o envio porque exige *Message Template* aprovado para iniciar conversa. Isso bate 100% com o que vimos: thread #1006 criada, lead Lívia sem mensagem.

Logs confirmam: todos os envios recentes recebem `{ success: true }` da GPT Maker — o problema não é nosso código falhando, é a Meta dropando a mensagem do lado deles.

## O que vamos fazer

### 1. Ajustar `send-whatsapp-gptmaker` ao contrato oficial
- Reduzir o body do POST para **estritamente** `{ phone, message }`, conforme docs.
- Remover `name`, `metadata`, `agentId`, `contact` do payload (não são suportados pela rota). O briefing continua salvo em `lead_activities` (uso interno do CRM), mas não viaja mais para a GPT Maker — não tem efeito lá.
- Manter idempotência 24h, normalização BR e logging atuais.

### 2. Detectar a causa real (oficial vs. não oficial)
Adicionar uma mensagem de erro explícita quando a resposta vier `success: true` mas suspeita (ou `400/403`). Hoje tratamos só `!response.ok`. A doc lista 400 e 403 como respostas possíveis — vamos logar o body inteiro em todos os casos para detectar bloqueios futuros.

### 3. Confirmação manual com o usuário (necessária — não temos como descobrir via código)
Precisamos que você verifique no painel da GPT Maker:
- O canal usado (`GPTMAKER_CHANNEL_ID`) é do tipo **WhatsApp não oficial** (QR Code / Baileys) ou **WhatsApp Oficial (Cloud API/Meta)**?
  - Se **oficial** → este endpoint não funciona para iniciar conversa fria. Precisamos: (a) trocar para um canal não-oficial **ou** (b) usar a rota de envio por *template* aprovado da Meta (não documentada nesta página — exigirá outra integração).
  - Se **não oficial** → o canal pode estar desconectado/sessão expirada. Reconectar via QR Code resolve.

## Detalhes técnicos

Body novo (edge function):
```ts
body: JSON.stringify({ phone, message: messageBody })
```

Tudo que era `metadata`, `agentId`, `contact.metadata` sai do request. A lógica de montagem do `messageBody` (template humanizado com `{{primeiro_nome}}`, `{{produto}}`, etc.) **continua igual** — é nele que o lead é cumprimentado.

O `briefing` interno deixa de existir como campo enviado; informação de produto/campanha/UTM já está em `lead_activities.metadata` para consumo do CRM.

## Próximo passo bloqueante

Antes de eu mexer no código, **me confirma o tipo do canal no painel da GPT Maker** (oficial Meta vs. não-oficial QR Code). Isso muda a solução final:
- não-oficial com sessão ativa → ajuste de payload resolve;
- oficial Meta → precisamos de outra rota (templates) e isso vira um segundo plano.

# Aprimorar disparo WhatsApp via GPT Maker — contexto real para o agente

## Diagnóstico

A documentação oficial do GPT Maker confirma duas coisas importantes:

**1. O endpoint `POST /v2/channel/{channelId}/start-conversation` aceita SOMENTE:**
```json
{ "phone": "string", "message": "string" }
```
Os campos `metadata` e `contact` que adicionamos hoje são **silenciosamente ignorados**. Por isso o agente "recebe" só o cabeçalho `[Lead novo · Produto: ... · Nome: ...]` que estamos colando dentro de `message`.

**2. Existe um endpoint feito exatamente para o nosso caso de uso:**
`POST /v2/agent/{agentId}/add-message` — descrito na doc como _"muito usado para quando fizer um disparo ativo por outras ferramentas e precisa adicionar essa mensagem ao contexto da conversa"_. Ele aceita:
```json
{
  "contextId": "<id externo do cliente>",
  "prompt": "<texto a ser salvo no contexto>",
  "role": "user" | "assistant"  // default: assistant
}
```

A resposta do canal `Zap MC` que você colou (`type: WHATSAPP`, `connected: true`) confirma que é WhatsApp não-oficial, compatível com `start-conversation`. Falta apenas o **`agentId`** vinculado a esse canal — esse ID não vem no payload de canais, então precisa ser configurado.

## Estratégia para múltiplas campanhas em paralelo

A pergunta de fundo é: como suportar várias campanhas Meta + vários produtos sem refatorar a cada nova fonte? Resposta:

- **Por canal/agente** — cada `lead_source` já pode ter seu `whatsapp_channel_id` próprio. Vamos adicionar um `whatsapp_agent_id` análogo (override por fonte, com fallback global em secret `GPTMAKER_AGENT_ID`).
- **Contexto rico no `add-message`** — em vez de espremer tudo numa string, mandamos um briefing bem formatado como `prompt` com `role: "assistant"` (assim o agente "se lembra" do contexto sem o lead ver isso como mensagem dele).
- **`contextId` estável** — usamos o telefone normalizado E.164 (ex: `5511999999999`) como `contextId`. É o mesmo identificador que o GPT Maker usa internamente para a conversa do WhatsApp, então o contexto que adicionamos liga corretamente ao chat criado pelo `start-conversation`.

## Fluxo novo do `send-whatsapp-gptmaker`

```text
1. Buscar lead + lead_source (já existe)
2. Validar telefone → normalizar para E.164 (já existe)
3. Idempotência 24h (já existe)
4. NOVO: se houver agentId (por fonte ou global) → chamar add-message
   POST /v2/agent/{agentId}/add-message
   {
     contextId: "<phone E.164>",
     role: "assistant",
     prompt: """
     [Briefing do lead recém-cadastrado — use isso para personalizar a abordagem]
     Produto/Curso: <produto_label>
     Campanha: <campanha_label ou utm_campaign>
     Origem (UTM): <utm_source / utm_medium>
     Nome: <name>
     Empresa: <company>
     Cargo: <cargo>
     Email: <email>
     Telefone: <telefone>
     [Custom fields relevantes...]
     """
   }
5. Chamar start-conversation com message = saudação curta
   (ex: "Olá <primeiro nome>! 👋" — vinda de GPTMAKER_INITIAL_MESSAGE
   ou template por fonte, se quisermos no futuro)
6. Logar tudo em whatsapp_send_log (incluindo se o add-message falhou
   mas o start-conversation deu certo)
```

Pontos de robustez:
- Se `add-message` falhar mas `start-conversation` der certo, o disparo segue (não bloqueia o WhatsApp do lead). Logamos `add_message_error` no `whatsapp_send_log.error` para auditoria.
- Se não houver `agentId` configurado (nem por fonte nem global), pulamos o `add-message` e funcionamos como hoje (compat retroativa).

## Arquivos a alterar

### 1. Migration — schema
- `lead_sources`: nova coluna `whatsapp_agent_id text` (nullable).
- `whatsapp_send_log`: nova coluna `agent_context_status text` (`sent`, `skipped`, `error`) + `agent_context_response jsonb` para auditoria.

### 2. `supabase/functions/send-whatsapp-gptmaker/index.ts`
- Ler env `GPTMAKER_AGENT_ID` (fallback global).
- No `select` do `lead_sources`, incluir `whatsapp_agent_id`.
- Antes do `start-conversation`, chamar `add-message` com o briefing.
- Atualizar log com resultado dessa chamada.

### 3. `supabase/functions/_shared/auth.ts`
- Adicionar `whatsapp_agent_id` ao `SELECT_COLS` (mesmo problema que tivemos com `whatsapp_channel_id`).

### 4. `supabase/functions/_shared/ingest-types.ts`
- Adicionar `whatsapp_agent_id?: string | null` à interface `LeadSource`.

### 5. `src/components/admin/integrations/IntegrationFormDialog.tsx`
- Novo input opcional **"Agent ID do GPT Maker"** logo abaixo do "Channel ID", com texto de ajuda explicando: _"Permite enviar o briefing do lead ao agente antes do start-conversation. Use o ID do agente vinculado a este canal."_
- Persistir `whatsapp_agent_id` junto com os outros campos.

### 6. `src/hooks/useLeadSources.ts` + `supabase/functions/manage-lead-source/index.ts`
- Aceitar e propagar `whatsapp_agent_id` no create/update.

### 7. Secret novo (opcional)
- Pedir `GPTMAKER_AGENT_ID` como fallback global. Se você usa apenas um agente hoje (atendendo todas as campanhas), ele será suficiente sozinho. Por fonte fica como override quando criar um agente dedicado por campanha.

## Por que essa estratégia escala para várias campanhas Meta

- **Mesmo agente, vários produtos:** todas as fontes apontam para o mesmo `GPTMAKER_AGENT_ID`. O briefing diferencia: o agente lê `Produto: Imersão X` vs `Produto: Curso Y` e ajusta o discurso (basta treinar o agente com instruções condicionais).
- **Agente por campanha:** se uma campanha grande merecer um agente próprio (prompt/treino diferente), basta criar o agente no GPT Maker, copiar o `agentId` e colar no campo da fonte. Zero deploy.
- **Mesmo canal, múltiplas campanhas:** o canal WhatsApp é um só (o número), mas o `add-message` enriquece a conversa de cada lead individualmente via `contextId = telefone`.

## Pergunta para você antes de implementar

**Você já tem o `agentId` do agente vinculado ao canal `Zap MC`?**
- Se **sim**: me passa que eu adiciono como secret `GPTMAKER_AGENT_ID` (fallback global) e tudo funciona out-of-the-box em todas as fontes existentes.
- Se **não / não sabe**: você acha no painel do GPT Maker em **Agentes → (clique no agente) → URL** (o ID é o trecho final da URL) ou na lista de agentes. Pode mandar depois — eu já deixo o código pronto e o campo no formulário; quem não tiver o ID continua funcionando como hoje (só `start-conversation`).

## Fora deste escopo (próximas iterações sugeridas)
- Templates de mensagem inicial customizáveis por fonte (hoje vem do env `GPTMAKER_INITIAL_MESSAGE`).
- Webhook reverso para registrar respostas do lead no CRM.
- Botão "Iniciar WhatsApp" manual no Lead Drawer.


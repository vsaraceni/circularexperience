## Diagnóstico

Cada lead novo abre **duas conversas no painel GPT Maker**:

1. **Card com ícone "API"** → vem do `POST /v2/agent/{agentId}/add-message` (etapa 5a no `send-whatsapp-gptmaker/index.ts`). Esse endpoint cria/usa um `contextId` (hoje passamos o `phone`) e injeta o briefing técnico (`📋 BRIEFING DO LEAD...`) como mensagem `role: assistant`. A GPT Maker renderiza isso como uma "conversa via API".
2. **Card com ícone WhatsApp** → vem do `POST /v2/channel/{channelId}/start-conversation` (etapa 5b). Esse sim envia mensagem real pelo canal WhatsApp e cria a conversa "de verdade" no painel.

Os dois cards aparecem como "Desconhecido" porque:
- O `add-message` usa o `phone` como `contextId` mas não cria contato vinculado — vira uma thread anônima.
- O `start-conversation` usa `phone` mas o nome do contato fica em `contact.name` que aparentemente nem sempre é renderizado no card-resumo (mostra só "Desconhecido").

## Plano de correção (combinando as 3 dores: briefing visível, mensagem técnica, threads duplicadas)

### Eliminar a thread duplicada

A solução mais limpa é **parar de chamar `add-message`** e injetar o briefing **dentro da mesma conversa do WhatsApp**, usando um recurso da própria GPT Maker:

**Opção A (preferida)** — Usar o campo `metadata` do `start-conversation` (já enviamos hoje) **enriquecido** com o briefing humano-legível, e um campo `contextMessage`/`systemContext` se a API suportar. Isso faz o agente IA receber o contexto sem aparecer como mensagem visível e sem criar segunda thread.

**Opção B (fallback se a API não tiver isso)** — Manter `add-message` mas usar como `contextId` o **chatId que retorna do `start-conversation`** em vez do `phone`. Aí as duas chamadas ficam vinculadas à mesma conversa, sem criar card duplicado. A ordem fica: chamar `start-conversation` primeiro, capturar `chatId` ou `conversationId` da resposta, depois `add-message` com esse id.

**Opção C (mais simples e segura)** — **Remover totalmente o `add-message`** e injetar o briefing como **prefixo invisível no system prompt do agente** via `metadata` (que a GPT Maker já encaminha pro agente). Funciona se o agente tiver instrução pra ler `metadata.briefing`. Sem segunda chamada → sem segunda thread.

Vou implementar **Opção C como default** + suporte a Opção B se a Opção C não bastar (configurável). Razão: menos chamadas, menos chance de erro, não polui o painel.

### Resolver "Desconhecido" no card

No `start-conversation`, garantir que enviamos:
```json
{
  "phone": "...",
  "message": "...",
  "contact": { "name": "Everton 2", "metadata": {...} },
  "name": "Everton 2"  // alguns endpoints leem do top-level também
}
```
Adicionar `name` no top-level do payload (além de `contact.name`) — barato e cobre as duas convenções.

### Mensagem inicial humana e contextual (foco do usuário agora)

Já planejado nas iterações anteriores, fica assim:

1. **Banco** — adicionar `lead_sources.whatsapp_initial_message text` (nullable). Template suporta `{{primeiro_nome}}`, `{{nome}}`, `{{produto}}`, `{{empresa}}`.
2. **Edge function** — resolver template com prioridade: coluna da fonte → env `GPTMAKER_INITIAL_MESSAGE` → fallback hardcoded `"Oi {{primeiro_nome}}! Vi seu interesse em {{produto}}. Posso te contar mais? 😊"`.
3. **Remover** o cabeçalho `[Lead novo · …]` do `messageBody`.
4. **Remover** a chamada `add-message` (ou condicionar via flag).
5. **Adicionar** `name` no top-level + `contact.name` populado no `start-conversation`.
6. Briefing rico vai como `metadata.briefing` (string formatada) dentro do `start-conversation` — disponível pro agente sem virar mensagem visível.

### UI Admin — `IntegrationFormDialog.tsx`

Adicionar Textarea **"Mensagem inicial no WhatsApp"** dentro do bloco WhatsApp já existente:
- Helper text: variáveis disponíveis + "Se vazio, usa o padrão global."
- Placeholder com exemplo bom.

## Arquivos afetados

- `supabase/migrations/<novo>.sql` — coluna `whatsapp_initial_message`
- `supabase/functions/send-whatsapp-gptmaker/index.ts` — remover `add-message`, resolver template, enriquecer `start-conversation`
- `supabase/functions/manage-lead-source/index.ts` — aceitar novo campo
- `src/hooks/useLeadSources.ts` — tipo
- `src/components/admin/integrations/IntegrationFormDialog.tsx` — campo no form

## Resultado esperado

- **Uma única thread por lead** no painel GPT Maker (some o card "API").
- Card mostra **nome do lead** (não mais "Desconhecido").
- Primeira mensagem visível é **humana e contextual**: "Oi Everton! Vi seu interesse em Circular Experience. Posso te contar mais? 😊"
- Agente IA continua tendo briefing completo via `metadata`.
- Cada fonte pode ter saudação própria.

## Risco / Plano B

Se ao testar virmos que o agente IA não está lendo `metadata.briefing` (Opção C falhou), ativamos Opção B na mesma edge function por feature flag — capturar `chatId` da resposta do `start-conversation` e chamar `add-message` com esse id (vincula à mesma thread em vez de criar nova). Sem mudança de schema, só lógica.

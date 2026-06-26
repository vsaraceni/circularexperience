## Diagnóstico confirmado

- Existem leads recentes da campanha `120246091006170301` com `campaign_id` correto, mas gravados como `origem = meta_ads` e `product_id = null`.
- O mapeamento dessa campanha existe e aponta para `meta_ads_conexao_circular`.
- O WhatsApp usa `lead.origem` para buscar a configuração do GPT Maker; por isso, quando o lead entra como `meta_ads`, ele envia a mensagem/agent padrão.
- Há também logs de WhatsApp antigos onde mesmo leads já corrigidos para `meta_ads_conexao_circular` foram enviados com `source_slug = meta_ads`, indicando que a correção precisa ser feita antes do disparo automático e também dentro da função de envio como defesa.

## Plano de correção definitiva

1. **Blindar no banco antes de qualquer trigger**
   - Criar uma função/trigger `BEFORE INSERT OR UPDATE` em `leads` que, sempre que houver `campaign_id`, consulta `meta_campaign_product_map` e força:
     - `origem = lead_sources.slug` mapeado;
     - `product_id = meta_campaign_product_map.product_id` ou `lead_sources.product_id`.
   - Isso garante que o trigger automático de WhatsApp já enxergue a origem correta.

2. **Blindar a função `send-whatsapp-gptmaker`**
   - Ao buscar o lead, incluir `campaign_id` e `product_id`.
   - Antes de buscar `lead_sources`, resolver novamente o mapeamento por `campaign_id`.
   - Se o lead ainda estiver como `meta_ads`, a função usará a fonte mapeada para escolher template/agente/produto e também atualizará o lead para a origem correta.
   - Assim, mesmo se algum caminho antigo inserir errado, o envio não cai mais no padrão.

3. **Corrigir dados já afetados**
   - Atualizar os leads existentes com `campaign_id` mapeado que ainda estão como `meta_ads` ou `product_id` vazio.
   - Corrigir `whatsapp_send_log.source_slug` dos registros recentes quando o lead já tiver campanha mapeada, para auditoria ficar coerente.
   - Não reenviar WhatsApp automaticamente para leads que já receberam mensagem, para evitar duplicidade.

4. **Ajustar configuração errada de campanha**
   - Atualizar os mapeamentos de Circular Experience que ainda apontam para a fonte genérica `meta_ads`, usando a fonte específica `meta_ads_circular_experience`.
   - Manter Conexão Circular apontando para `meta_ads_conexao_circular`.

5. **Melhorar painel de integrações**
   - No painel “Campanhas Meta Ads → Produto”, destacar campanhas mapeadas para a fonte genérica `meta_ads` como configuração inválida/arriscada.
   - Mostrar uma contagem de leads recentes mapeados incorretamente mesmo quando a campanha já está cadastrada, não apenas campanhas sem mapeamento.

6. **Validação final**
   - Consultar novamente leads recentes por campanha para confirmar `origem` e `product_id` corretos.
   - Testar a edge function `send-whatsapp-gptmaker` em modo controlado com um lead afetado/novo sem gerar reenvio duplicado.
   - Conferir logs/auditoria para garantir que o source resolvido é o específico, não `meta_ads`.
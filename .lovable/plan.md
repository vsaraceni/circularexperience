# Pacote de melhorias: e-mails por usuário + novo lead manual

Duas entregas independentes, sem alterar o que já funciona hoje.

---

## 1. Cada pessoa (SDR e Closer) configura o próprio e-mail

**Hoje:** "Configurar Emails" só aparece para admins e o texto de boas-vindas é único para o time inteiro (tabela global `email_templates`, slug `lead-welcome`). O disparo manual pelo Kanban já usa nome/e-mail/telefone de quem clicou na assinatura, mas o corpo é sempre o mesmo.

**Depois:** todo usuário aprovado vê "Configurar Emails" no menu do avatar e pode criar a sua própria versão do e-mail de boas-vindas — assunto, texto e imagem — partindo do padrão da equipe.

Regras:
- Cada usuário só enxerga e edita a própria versão.
- Botão "Restaurar padrão" apaga a personalização e volta ao texto oficial.
- Admin continua tendo, numa aba separada, o padrão da equipe e os textos dos e-mails automáticos (Missões do Dia, Alerta Proposta, Performance) — nada disso muda.
- Envio manual pelo Kanban/Drawer passa a usar a versão de quem disparou; se a pessoa não personalizou, cai no padrão.
- Envio **automático** (lead novo chegando de anúncio/LP) continua usando o padrão institucional, sem alteração de comportamento.
- Preview antes de salvar, com as variáveis atuais ({{name}}, {{company}}, {{sender_name}}, etc.).

---

## 2. Botão "Novo Lead" (entrada manual)

**Hoje:** só dá para criar lead manualmente como efeito colateral de uma proposta (helper `createManualLead...`, que já entra em "Proposta"). Não existe entrada de lead "cru".

**Depois:** botão **Novo Lead** na barra do Pipeline (Kanban e visão To-Do) abrindo um formulário curto:
- Nome, e-mail, telefone, empresa, cargo
- Origem (lista de origens ativas, incluindo as manuais: Outbound, Inbound Orgânico, Indicação, Evento) + detalhe livre
- Produto
- Estágio inicial (padrão **Novo**)
- Calor do lead e observação
- Responsável: por padrão quem está criando
- Chave "Enviar boas-vindas automaticamente" — **desligada por padrão**, para o SDR conduzir o envio quando quiser

O lead entra no fluxo padrão: aparece no Kanban, gera notificação de novo lead, entra nas métricas e nos SLAs como qualquer outro.

Proteções para não quebrar nada:
- Com a chave desligada, o e-mail automático não sai, mas o botão "Enviar Boas-Vindas" do Kanban continua disponível.
- Disparo automático de WhatsApp não acontece para origens manuais (elas já estão configuradas assim).
- Telefone validado/normalizado no mesmo padrão do resto do CRM.
- Duplicidade: aviso se já existir lead com o mesmo e-mail ou telefone, com link para abrir o lead existente.

---

## Detalhes técnicos

**Banco**
- Nova tabela `user_email_overrides` (`user_id`, `template_slug`, `subject`, `body_html`, `updated_at`, único por usuário+slug), com GRANTs para `authenticated`/`service_role`, RLS `user_id = auth.uid()` para todas as operações e leitura extra para admin. Mesmo padrão já usado em `user_template_overrides`.
- RPC `get_email_template_base(p_slug text)` SECURITY DEFINER retornando apenas `subject`, `body_html`, `from_name` — permite ao não-admin partir do padrão sem afrouxar a RLS de `email_templates` (que segue admin-only). EXECUTE só para `authenticated`, com `search_path` fixo.
- Nenhuma alteração em `leads`, triggers ou snapshots.

**Edge function `send-welcome-email`**
- Aceita `sender_user_id` opcional. Quando presente, busca `user_email_overrides` desse usuário para `lead-welcome` e usa `subject`/`body_html` dela; senão mantém o template global. `from_name`/`from_email`/`reply_to` e a substituição de variáveis permanecem como estão, assim como a guarda de idempotência e o CC do SDR.
- Chamada automática (trigger) não envia `sender_user_id` → comportamento atual preservado.

**Frontend**
- `EmailTemplateEditor.tsx`: passa a ser renderizado para todos no `CrmNavbar` (hoje dentro do bloco `isAdmin`); ganha aba "Meu e-mail de boas-vindas" (todos) e mantém as abas atuais visíveis apenas para admin. Reutiliza `RichTextEditor`.
- `Pipeline.tsx`: envia `sender_user_id: user.id` no invoke de `send-welcome-email`.
- Novo `NewLeadDialog.tsx` (baseado em `LeadEditDialog`, sem duplicar lógica de telefone: reusa `@/lib/phone`), acionado por um botão na toolbar do Pipeline; origens carregadas via `list_active_lead_sources()`.
- `src/lib/manualLead.ts`: extrair função `createManualLead({ stage, suppressWelcome, ... })`; o fluxo de proposta passa a chamá-la com os mesmos parâmetros de hoje (estágio `proposta`, welcome suprimido), sem mudança de comportamento.

**Verificação**
- Envio manual com e sem personalização; envio automático de um lead simulado continua com o texto padrão.
- Criação manual nos dois modos da chave de boas-vindas, conferindo Kanban, notificação e ausência de WhatsApp automático.

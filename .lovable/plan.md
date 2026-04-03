

## Implementação: Email 2 (Alerta de Proposta) + Email 3 (Performance WhatsApp) + Refinamento Visual

### Visão Geral

Três entregas:
1. **Email de alerta** quando lead vai para "Call Agendada" — enviado ao dono do lead
2. **Resumo de performance** no final do dia — formato WhatsApp copiável, agrupado por operador
3. **Refinamento visual** de todos os templates com paleta Movimento Circular e remetente "Muti CRM"

---

### 1. Template `call-scheduled-alert.tsx`

Novo template React Email em `_shared/transactional-email-templates/`:
- **Remetente**: Muti CRM
- **Subject**: "🔔 Nova proposta solicitada — {empresa ou nome}"
- **Conteúdo**: dados do lead (nome, empresa, cargo, telefone, email), seção de briefing (ou aviso "sem briefing"), prazo "2 dias úteis" como lembrete
- **CTA**: botão "Elaborar Proposta" apontando para o CRM
- **Visual**: paleta Movimento Circular — header roxo (#5F2558), botão turquesa (#2FB2C0), fundo branco, destaques em laranja (#F4A736)

### 2. Gatilho no KanbanBoard.tsx

Adicionar chamada fire-and-forget a `send-transactional-email` nos dois pontos onde lead muda para `call_agendada`:
- `handleDragEnd` (linha ~210)
- `handleQuickAction` case `schedule_call` (linha ~311)

Lógica:
1. Buscar email do `assigned_to` via `profiles`
2. Invocar `send-transactional-email` com template `call-scheduled-alert`, dados do lead e idempotencyKey `call-alert-{leadId}-{timestamp}`

### 3. Template `daily-performance.tsx`

Novo template React Email:
- **Remetente**: Muti CRM
- **Subject**: "📊 Performance do dia — {data}"
- **Conteúdo**: bloco de texto pré-formatado com emojis, pronto para copiar e colar no WhatsApp
- **Formato por operador**:
```text
📊 *Performance — segunda, 3 de abril*

👤 *João Silva*
↗️ Avanços de fase: 5
📅 Agendamentos: 2
📄 Propostas: 1
🤝 Deals: 0

👤 *Maria Santos*
↗️ Avanços de fase: 3
...

🏆 *Total do time*
↗️ 8 | 📅 3 | 📄 2 | 🤝 1
```
- Botão "Copiar para WhatsApp" (deep link ou instrução)
- Visual alinhado à paleta da marca

### 4. Lógica de performance no `check-notifications`

Adicionar modo `"daily-performance"`:
- Consultar `lead_activities` do dia agrupado por `user_id`
- Contar: `stage_mudou` (avanços), `call_agendada` (agendamentos), `proposta_enviada` (propostas), `fechado` (deals)
- Cruzar com `profiles` para nome do operador
- Enviar via `send-transactional-email` com template `daily-performance`

### 5. Cron para performance (18h BRT = 21h UTC)

Inserir novo cron job via migração SQL:
```sql
SELECT cron.schedule(
  'daily-performance-report',
  '0 21 * * 1-5',
  $$SELECT ... invoke check-notifications com mode=daily-performance$$
);
```

### 6. Refinamento visual de todos os templates

**Remetente**: Alterar `SITE_NAME` em `send-transactional-email/index.ts` de `"circularexperience"` para `"Muti CRM"`

**Template `daily-digest.tsx`** — refinar com a paleta completa:
- Header com faixa roxo (#5F2558) e texto branco
- Barra de progresso turquesa (#2FB2C0)
- Missões com cores semânticas: verde (#2FB2C0) para zero, laranja (#F4A736) para poucos, rosa (#EB626D) para 3+
- Fundo de seções em cinza claro (#F0ECEA)
- Botão CTA roxo (#5F2558) com hover
- Tipografia Inter
- Logo/marca no topo

**Mesma paleta nos novos templates** (`call-scheduled-alert` e `daily-performance`).

### 7. Registro no `registry.ts`

Importar e registrar os 2 novos templates no mapa `TEMPLATES`.

### 8. Deploy

Fazer deploy de `send-transactional-email` e `check-notifications` após alterações.

---

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `_shared/transactional-email-templates/call-scheduled-alert.tsx` | Criar |
| `_shared/transactional-email-templates/daily-performance.tsx` | Criar |
| `_shared/transactional-email-templates/daily-digest.tsx` | Refinar visual |
| `_shared/transactional-email-templates/registry.ts` | Registrar 2 templates |
| `supabase/functions/send-transactional-email/index.ts` | Alterar SITE_NAME para "Muti CRM" |
| `supabase/functions/check-notifications/index.ts` | Adicionar modo daily-performance |
| `src/components/admin/KanbanBoard.tsx` | Adicionar envio de alerta ao mover para call_agendada |
| Migração SQL | Cron job 21h UTC seg-sex para performance |


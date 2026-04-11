

## Ferramentas: CSV Download + Envio em Massa

### 1. Download CSV dos Leads Filtrados

**Melhor local para o botão:** No menu "More" (ícone ⋮) que já existe na toolbar do Pipeline (linha 535-546), ao lado de "Ver Leads Perdidos". Adicionar um item "Exportar leads filtrados (CSV)". Isso exporta exatamente os leads que o usuário está vendo após aplicar os filtros — faz sentido contextual e não polui a interface.

**Implementação:** Gerar o CSV no lado do cliente com os dados já carregados em `filteredLeads`. Sem necessidade de Edge Function — os dados já estão no frontend. Colunas: Empresa, Nome, Email, Telefone, Cargo, Etapa, Origem, Porte, Responsável, Valor Proposta, Criado em.

---

### 2. Envio de Email em Massa — Análise Crítica

**O que você quer é legítimo:** enviar comunicações pontuais e manuais para um grupo segmentado de leads do CRM (ex: todos os Tier 1 em "Em Contato"). Isso é uma ferramenta de outreach comercial, não marketing automatizado.

**Como implementar de forma segura:**

- Criar uma Edge Function `send-bulk-email` que recebe uma lista de `lead_ids`, `subject` e `body_html`
- A função itera os leads via service_role, envia individualmente via Resend (que já está configurado), e registra cada envio como atividade no lead (`lead_activities`)
- O envio é sequencial com delay entre cada email para respeitar rate limits da Resend
- No final, retorna um relatório: `{ sent: X, failed: Y, errors: [...] }`

**Interface:**
- Na view To-Do List (PriorityListView), após aplicar filtros, aparece um botão "Enviar email para N leads filtrados" na toolbar
- Abre um Dialog com: Assunto (input), Mensagem (editor HTML rico — reutilizar o `RichTextEditor` que já existe no sistema de boas-vindas)
- Botão de confirmação com contagem: "Enviar para 12 leads"
- Ao clicar, chama a Edge Function e exibe um toast com o relatório final

**Registro de atividade:** Cada envio cria um registro em `lead_activities` com:
- `activity_type: "email_massa_enviado"`
- `content: "Email em massa: {assunto}"`
- `metadata: { subject, sent_at }`

Isso aparece na timeline de cada lead.

---

### Plano de Implementação

| Arquivo | Mudança |
|---------|---------|
| `src/pages/admin/Pipeline.tsx` | Adicionar item "Exportar CSV" no DropdownMenu e botão "Enviar email" na toolbar |
| `src/components/admin/BulkEmailDialog.tsx` | **Novo** — Dialog com assunto + editor HTML + botão enviar |
| `supabase/functions/send-bulk-email/index.ts` | **Nova** Edge Function — envia emails via Resend e registra atividades |
| `supabase/config.toml` | Adicionar `[functions.send-bulk-email]` |

### Pontos de atenção

1. **Rate limit Resend:** A conta gratuita permite ~100 emails/dia. O envio será sequencial com 500ms de delay entre cada email.
2. **Proteção contra abuso:** A função valida JWT e só aceita usuários autenticados com role admin.
3. **Tamanho do lote:** Limitar a 50 leads por envio para evitar timeouts na Edge Function.
4. **Emails suprimidos:** Verificar a tabela `suppressed_emails` antes de enviar — não enviar para quem deu unsubscribe/bounce.


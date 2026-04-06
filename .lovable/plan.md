

## Relatório de Avanços On-Demand no Menu Admin

### O que será feito

Um novo item no menu do avatar do administrador chamado "Relatório de Avanços" que abre um dialog/modal onde o gestor pode:

1. Escolher o período de consolidação: Hoje, Ontem, Semana passada, Mês passado, Últimos 30 dias
2. Clicar em "Gerar Relatório" para produzir uma mensagem formatada (igual ao email de digest) com:
   - Missões do pipeline (Novos, Follow-up, Agendamento, Calls, Briefing) com contagens
   - Barra de progresso das missões
   - Ações realizadas no período (total + por categoria)
   - Follow-ups agendados/concluídos/atrasados
   - SLA críticos
3. Botão "Copiar" para copiar a mensagem como texto para colar no WhatsApp/email

### Implementação

| Arquivo | Ação |
|---------|------|
| `src/components/admin/DigestReportDialog.tsx` | **Novo** — Dialog com seletor de período, geração de relatório formatado, botão copiar |
| `src/components/admin/CrmNavbar.tsx` | Adicionar item "Relatório de Avanços" no DropdownMenu do avatar (ao lado de Perfil e Central de Emails) |

### Detalhes do componente `DigestReportDialog`

- **Seletor de período**: Select com opções "Hoje", "Ontem", "Semana passada", "Mês passado", "Últimos 30 dias"
- **Dados**: Reutiliza a mesma lógica do `usePerformanceDashboard` e `MissionsBanner` — consulta `leads`, `lead_activities` e `lead_follow_ups` no período selecionado
- **Saída visual**: Card estilizado com as mesmas seções do email digest (missões com cores, progresso, resumo de ações)
- **Saída texto**: Versão plaintext formatada para copiar (emoji + texto, estilo WhatsApp)
- **Botão "Copiar relatório"**: Copia o texto formatado para o clipboard com toast de confirmação

### Exemplo de saída copiável

```
☀️ Relatório de Avanços — 01/04 a 06/04

🎯 Missões: 3/5 resolvidas
  ✅ Follow-up (0)
  ✅ Calls (0)
  ✅ Briefing (0)
  ⚠️ Novos (2)
  ⚠️ Agendamento (3)

📊 Ações no período: 47
  Comunicação: 18 | Progresso: 12 | Propostas: 8 | Follow-up: 6 | Outros: 3

📋 Follow-ups: 15 agendados, 12 concluídos, 2 atrasados
🚨 SLA críticos: 3 leads
```

### Sem migração SQL
Todos os dados já existem nas tabelas `leads`, `lead_activities` e `lead_follow_ups`.


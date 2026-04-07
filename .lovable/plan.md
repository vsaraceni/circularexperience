

## Unificar notas e reestruturar Follow-ups no Drawer

### Análise do estado atual

O drawer tem **3 pontos** onde se registram notas/próximas ações:

1. **Aba Resumo** — bloco "Próxima Ação" (campo texto livre salvo em `leads.proxima_acao`) + "Valor da Proposta" (salvo em `leads.valor_proposta`)
2. **Aba Follow-ups** — formulário com Data + Nota (opcional) → salva em `lead_follow_ups`
3. **Aba Atividades** — textarea "Adicionar nota" → salva em `lead_activities` como `nota_manual`

### Problemas identificados

- "Próxima Ação" na aba Resumo é essencialmente um follow-up sem data — duplica a funcionalidade
- "Valor da Proposta" na aba Resumo é desvinculado da proposta real (que já existe na tabela `proposals.investment`) — dado redundante e confuso
- Nota na aba Atividades duplica a capacidade de registrar observações que o follow-up já cobre
- Ao mover um lead de estágio (drag-and-drop), não há prompt para registrar o próximo passo

### Plano de mudanças

**1. Remover da aba Resumo**
- Remover o bloco "Próxima Ação" (`ProximaAcaoField`) e "Valor da Proposta" (`ValorPropostaField`)
- Manter o botão "Avançar Etapa" e o restante (dados do lead, empresa, briefing, mensagens)

**2. Remover nota da aba Atividades**
- Remover a textarea "Adicionar nota" e botão "Salvar nota" da aba Atividades
- Atividades fica somente como timeline de leitura (histórico)

**3. Reestruturar aba Follow-ups**
- Renomear para "Próximo Passo" (ou manter "Follow-ups")
- Formulário estruturado:
  - **Próxima Ação** (textarea obrigatória — não permite gravar sem nota)
  - **Data** (date picker obrigatório)
  - Botão "Agendar"
- Validação: ambos os campos são obrigatórios
- O restante da aba (lista de pendentes, concluídos) permanece igual

**4. Abrir drawer ao mover lead de estágio**
- No `KanbanBoard.tsx`, após `handleDragEnd` com sucesso, abrir o drawer na aba "Follow-ups" automaticamente para que o usuário registre o próximo passo
- Adicionar prop `defaultTab` ao `LeadDrawer` para controlar qual aba abre
- Mesmo comportamento no `AdvanceStageButton` (botão "Avançar Etapa" dentro do drawer): após avançar, trocar para a aba de follow-ups

### Visão crítica e melhorias sugeridas

- **Nota como campo obrigatório no FUP é a decisão certa**: elimina follow-ups vagos sem contexto
- **Valor da Proposta pode ficar somente na proposta real** (`proposals.investment`), que já existe e é exibido no Kanban. Removê-lo do lead simplifica a interface
- **O campo `proxima_acao` no banco não precisa ser deletado** — apenas deixa de ser exibido/editado. Dados existentes ficam preservados
- **Ao abrir o drawer pós-move, não bloquear o fluxo** — o drawer abre mas o usuário pode fechar sem agendar. Forçar seria prejudicial ao ritmo de trabalho

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `src/components/admin/LeadDrawer.tsx` | Remover ProximaAcaoField e ValorPropostaField da aba Resumo; remover nota da aba Atividades; tornar nota obrigatória no form de follow-up; adicionar prop `defaultTab` |
| `src/components/admin/KanbanBoard.tsx` | Após drag-and-drop bem-sucedido, abrir drawer na aba follow-ups |

### Sem migração SQL necessária

A tabela `lead_follow_ups` já tem o campo `note` (nullable). A obrigatoriedade será apenas no frontend.


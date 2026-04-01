

## Adicionar "Lost" em Boas-Vindas + Botões de avanço de estágio

### Mudanças

**Arquivo: `src/components/admin/LeadCard.tsx`**

1. **LOST_STAGES** — Adicionar `"boas_vindas"` ao Set (linha 38):
   ```
   new Set(["boas_vindas", "em_contato", "call_agendada", "proposta", "nutricao"])
   ```

2. **Botão "Em Contato"** no estágio `boas_vindas` — Adicionar ação `move_to_contact` após LinkedIn e Copiar Zap:
   ```
   { icon: <CheckCircle />, label: "Em Contato", action: "move_to_contact" }
   ```

3. **Botão "Proposta Enviada"** no estágio `proposta` — Quando `hasProposal`, trocar/adicionar ação `move_to_nutricao` com label "Proposta Enviada" que move direto para nutrição (alternativa ao "Registrar Envio" que abre dialog — manter ambos, o "Registrar Envio" permite selecionar canal e notas, o "Proposta Enviada" é um atalho rápido).

   Na verdade, o "Registrar Envio" já move para nutrição. Manter como está — já cumpre a função. O label pode ser ajustado para "Proposta Enviada" para ficar mais claro.

4. **Tooltip** — Adicionar entradas no `TOOLTIP_MAP` para as novas ações.

**Arquivo: `src/components/admin/KanbanBoard.tsx`**

5. **Handler `move_to_contact`** — No `handleQuickAction`, adicionar case que:
   - Atualiza `kanban_stage: "em_contato"`, `stage_updated_at`, `last_activity_at`
   - Registra atividade `"em_contato"` com content "Lead retornou contato"
   - Toast "Lead movido para Em Contato!"

### Resumo

| Arquivo | Mudança |
|---------|---------|
| `LeadCard.tsx` | Adicionar `boas_vindas` ao LOST_STAGES, botão "Em Contato" no estágio boas_vindas, tooltip |
| `KanbanBoard.tsx` | Handler `move_to_contact` no switch |




## Correção da Contagem + Progresso Visual de Envio

### Diagnóstico da discrepância

O `BulkEmailDialog` recebe `filteredLeads` do Pipeline (143 leads após filtros globais). Mas a PriorityListView tem **filtros internos por coluna** (Etapa, SLA, Porte, Responsável) nas linhas 185-188 que reduzem os 143 para 30. O dialog não tem acesso a esses filtros internos — por isso mostra 143 quando deveria mostrar 30.

### Solução

**1. Passar os leads já filtrados pela PriorityListView ao dialog**

- Adicionar uma prop `onFilteredLeadsChange` na `PriorityListView` que emite o array `filteredRows` sempre que muda
- No `Pipeline.tsx`, capturar esse array em um state `priorityFilteredLeads`
- Passar `priorityFilteredLeads` (quando em modo priorities) ao `BulkEmailDialog` em vez de `filteredLeads`
- Isso garante que o dialog receba exatamente os leads visíveis na tabela

**2. Progresso visual de envio em tempo real**

Mudar a arquitetura: em vez de enviar todos os IDs numa única chamada, enviar **um lead por vez** do frontend, atualizando o progresso visualmente.

- Criar estado `sendProgress: { current: number, total: number, sent: number, failed: number } | null`
- No `handleSend`, iterar sobre os leads chamando a Edge Function com `lead_ids: [id]` (um de cada vez)
- A cada resposta, atualizar o progresso: "Enviando 3/30... ✅ 2 enviados"
- Mostrar uma barra de progresso animada + contadores em tempo real
- Botão muda para "Cancelar envio" durante o processo (com flag `abortRef`)
- No final, exibir resumo completo

**3. UI do progresso no dialog**

Quando `sendProgress !== null`, substituir o formulário por uma tela de progresso:
- Barra de progresso (`Progress` component)
- Texto: "Enviando email 3 de 30..."
- Contadores: ✅ Enviados: 2 · ❌ Falhas: 0 · ⏭️ Suprimidos: 1
- Botão "Cancelar" para interromper o envio

---

### Arquivos impactados

| Arquivo | Mudança |
|---|---|
| `src/components/admin/PriorityListView.tsx` | Adicionar prop `onFilteredLeadsChange` que emite `filteredRows` via `useEffect` |
| `src/pages/admin/Pipeline.tsx` | Capturar leads filtrados da PriorityListView; passar ao BulkEmailDialog |
| `src/components/admin/BulkEmailDialog.tsx` | Envio sequencial lead-a-lead com progresso visual, barra de progresso, botão cancelar |
| `supabase/functions/send-bulk-email/index.ts` | Sem mudança (já suporta 1 lead por chamada) |


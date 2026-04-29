## Resumo das decisões
1. Sem nova etapa no Kanban. Em vez disso, adicionar **"Parceria que não gerou proposta"** como motivo de perda (arquiva via fluxo "Perdido" existente).
2. Excluir lead "Novo": **somente admin**.
3. Edição dos dados do lead: **inline (click-to-edit)** no Drawer.

---

## 1. Edição inline dos dados do lead

No `LeadDrawer.tsx`, no Accordion **"Dados do Lead"**, transformar Nome, E-mail, Empresa, Telefone e Cargo em campos click-to-edit:

- Criar um componente local `EditableField` que renderiza o valor atual com um lápis discreto no hover; ao clicar abre um `Input` inline com botões Salvar (Check) / Cancelar (X). Salva no `Enter`, cancela no `Esc`.
- Mantém a estrutura visual do `InfoRow` (ícone, label, valor) — só o `value` vira interativo.
- O ícone permanece clicável para LinkedIn (nome) / WhatsApp (telefone) / mailto, separado do edit (clicar no lápis ou no texto entra em modo edição; clicar no ícone abre o link).
- Salvamento:
  - `await supabase.from("leads").update({ [campo]: novoValor }).eq("id", lead.id)`
  - Insere `lead_activities` com `activity_type: "lead_editado"` e `content: "Campo X alterado: 'antes' → 'depois'"`
  - Atualiza `last_activity_at = now()` no mesmo update
  - `toast.success("Atualizado!")` e `onNoteAdded?.()` para refresh do board
- Validação client-side mínima:
  - **Nome**: obrigatório, max 200
  - **E-mail**: regex simples + max 320
  - **Telefone**: aceita dígitos, `+`, espaços, `()`, `-`; max 40
  - **Empresa / Cargo**: opcional, max 255 / 120
  - Em erro: `toast.error` e mantém modo edição

## 2. Excluir lead "Novo" (admin)

No footer do `LeadDrawer.tsx`, quando `lead.kanban_stage === "novo"` **e** `isAdmin === true`, adicionar um botão discreto **"Excluir"** (variant `ghost`, ícone `Trash2`, texto vermelho) ao lado do "Enviar Boas-Vindas":

- Abre `AlertDialog` de confirmação: *"Excluir permanentemente este lead? Esta ação não pode ser desfeita e remove todas as atividades vinculadas."*
- Executa `await supabase.from("leads").delete().eq("id", lead.id)` (RLS já permite admin deletar leads).
- `lead_activities`, `lead_follow_ups`, `notifications` etc. ficam órfãs (não há FK no schema). Aceitável, ou opcionalmente fazer cleanup explícito antes do delete (recomendo manter simples por ora — o lead some das listas).
- Após sucesso: fecha drawer, `onLeadUpdated()`, `toast.success("Lead excluído")`.
- Para usuários não-admin: botão não aparece (já têm "Arquivar" via `LeadEditDialog`, mas o drawer não tem essa ação — manter assim, decisão do usuário).

## 3. Motivo de perda "Parceria que não gerou proposta"

No `LostDialog.tsx`, adicionar à constante `LOST_REASONS` o item:

```text
"Parceria que não gerou proposta"
```

Posição sugerida: logo após **"Timing — pode voltar no futuro"** ou no topo, dependendo da prioridade de uso. Recomendo logo após "Sem fit com o produto" para agrupar motivos qualitativos.

Nada mais precisa mudar — o fluxo "Perdido" já:
- Registra `lost_reason`, `lost_notes`, `lost_at_stage`
- Move para `kanban_stage = "perdido"`
- Aparece em `LostLeadsView` filtrável por motivo
- O Cockpit Estratégico já trata `perdido` corretamente (usa `lost_at_stage` para reconstruir o funil)

## Arquivos a tocar

- `src/components/admin/LeadDrawer.tsx` — `EditableField` inline, botão Excluir admin no footer (recebe `isAdmin` que já existe na prop), confirmação via `AlertDialog`.
- `src/components/admin/LostDialog.tsx` — adicionar 1 string em `LOST_REASONS`.

Sem migrations. Sem mudanças em hooks, dashboards ou edge functions.

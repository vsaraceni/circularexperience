## Objetivo

No LeadDrawer (Resumo → Dados do Lead), substituir a linha estática **"Porte"** por um seletor de **Tier** com 3 opções (Tier 1, 2, 3), salvando direto no lead. O ícone já reflete a cor do tier no kanban — agora também no drawer, e editável.

## Como o Tier é definido hoje

Não existe coluna `tier` no banco. Tier é **derivado** de `leads.colaboradores` (visto em `LeadCard.tsx`):

- **Tier 1** (laranja `#F4A736`) — `501_a_2000` ou `acima_de_2000` — "500+ colaboradores"
- **Tier 2** (turquesa `#2FB2C0`) — `101_a_500` — "101–500 colaboradores"
- **Tier 3** (cinza `#9E9E9E`) — qualquer outro valor não vazio — "Até 100"

## Decisão

Manter `colaboradores` como fonte de verdade (sem migração). Editar o tier escreve um valor canônico em `colaboradores`:

- Tier 1 → `acima_de_2000`
- Tier 2 → `101_a_500`
- Tier 3 → `51_a_100`
- Não informado → `null`

A função `getTierInfo` continua funcionando inalterada para o card.

## Mudança em `src/components/admin/LeadDrawer.tsx`

Substituir a linha:
```tsx
<InfoRow icon={<Building2 />} label="Porte" value={formatColaboradores(lead.colaboradores)} />
```

Por uma linha com label "Tier" + `Select` compacto (mesmo padrão visual do "Responsável" e do "Calor" logo abaixo):

- Ícone `Building2` colorido com a cor do tier atual (ou cinza se vazio).
- Label: **Tier**.
- `Select` (`h-7 text-xs`) com 4 opções:
  - "Não informado"
  - "Tier 1 — 500+"
  - "Tier 2 — 101 a 500"
  - "Tier 3 — até 100"
- `value` derivado de `getTierFromColaboradores(lead.colaboradores)`.
- `onValueChange` faz `supabase.from("leads").update({ colaboradores: <valor canônico> }).eq("id", lead.id)`, toast de sucesso e `onNoteAdded?.()` para refresh.

Adicionar duas helpers locais no arquivo:
- `getTierFromColaboradores(c)` → `"1" | "2" | "3" | ""`.
- `tierToColaboradores(t)` → string canônica ou `null`.
- `TIER_COLORS = { "1": "#F4A736", "2": "#2FB2C0", "3": "#9E9E9E" }` para colorir o ícone.

## Fora de escopo

- Não alterar `LeadCard` (já mostra o tier corretamente).
- Não criar nova coluna nem migração.
- Sem registro em `lead_activities` (mudança simples, igual ao Calor).

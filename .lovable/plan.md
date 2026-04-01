

## Redesign do topo do CRM — Layout full-height com board fixo

### Objetivo

Comprimir o topo para ~2 linhas, eliminar scroll vertical da página, e fazer o Kanban ocupar 100% do espaço restante — como Trello/Linear. Apenas mudanças visuais e de layout, zero impacto em funcionalidade.

### Estrutura atual (4 linhas antes do board)

```text
Linha 1: Navbar (logo, view toggle, dashboard, notificações, avatar)  — 56px
Linha 2: Filtros + busca + Nova Proposta                              — ~40px
Linha 3: MissionsBanner                                               — ~44px
Linha 4: Sort pills (Urgência/Chegada/Parados)                       — ~32px
         ─── Board Kanban (com scroll vertical da página) ───
```

### Estrutura nova (2 linhas)

```text
Linha 1: Navbar (mantém como está)                                    — 56px
Linha 2: [🎯 Missões + pills] [sort pills] | [Filtros popover] [Busca] [⋮] [+ Nova Proposta]  — ~40px
         ─── Board Kanban (h = calc(100vh - 96px), sem scroll na page) ───
```

### Mudanças detalhadas

**Arquivo: `src/pages/admin/Proposals.tsx`**

1. **Container principal** — trocar `min-h-screen` por `h-screen overflow-hidden` (impede scroll vertical da página)

2. **Main** — no modo kanban, trocar `py-6 px-6` por `px-4 pt-2 pb-0` + `flex flex-col` + `flex-1 overflow-hidden` (ocupa espaço restante sem scroll)

3. **Barra unificada (Linha 2)** — fundir MissionsBanner, sort pills, filtros e ações numa única linha:
   - **Lado esquerdo**: Chip "🎯 Missões" com badge de urgentes + mission pills (já existem no MissionsBanner) + sort pills (movidos do KanbanBoard)
   - **Separador vertical** `|`
   - **Lado direito**: Botão "Filtros" com popover contendo os 4 selects (Origem, Responsável, Período, Status) + badge de filtros ativos + busca colapsável + menu `⋮` + botão "Nova Proposta"

4. **Filtros em popover** — Os 4 selects saem da barra principal e vão para dentro de um `Popover`. O botão "Filtros" mostra um badge numérico quando há filtros ativos (conta quantos != "all")

5. **Busca compacta** — Campo de busca com ícone, expande ao focar (`w-8` → `w-[180px]` com transição)

**Arquivo: `src/components/admin/KanbanBoard.tsx`**

6. **Remover sort pills** — O bloco de ordenação (linhas 387-410) sai daqui e vai para a barra unificada em Proposals.tsx. O `sortMode` e `setSortMode` serão recebidos via props.

7. **Board full-height** — O container `div.flex.gap-4.overflow-x-auto` recebe `flex-1 overflow-hidden` e as colunas recebem `h-full` para preencher todo o espaço

**Arquivo: `src/components/admin/KanbanColumn.tsx`**

8. **Colunas full-height** — Trocar `max-h-[calc(100vh-240px)]` por `flex-1 overflow-y-auto` para que as colunas expandam naturalmente até o fundo da tela

**Arquivo: `src/components/admin/MissionsBanner.tsx`**

9. **Inline mode** — Novo prop `inline?: boolean`. Quando `true`, renderiza apenas os pills (sem wrapper com borda/padding/progress bar), para embutir na barra unificada. O chip "🎯 Missões" + counter/team ficam, mas sem o container card.

**Arquivo: `src/components/admin/LeadCard.tsx`**

10. **Borda lateral de urgência** — Expandir a borda esquerda colorida para todos os níveis (não só critical):
    - Vermelho `#D32F2F` para critical
    - Âmbar `#F4A736` para warning  
    - Verde discreto `#66BB6A` para normal com SLA ativo
    - Sem borda para estágios sem SLA (fechado, perdido)

### O que NÃO muda

- Nenhuma funcionalidade, rota, lógica de filtro ou dado
- Comportamento de clique/drag dos cards
- Cores dos pills de missão
- Ícones e avatares
- Navegação entre páginas
- View mode "list" (continua como está)

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `Proposals.tsx` | Layout full-height, barra unificada, filtros em popover, busca colapsável |
| `KanbanBoard.tsx` | Remove sort pills, recebe sortMode via props, board flex-1 |
| `KanbanColumn.tsx` | Colunas com height flexível |
| `MissionsBanner.tsx` | Modo inline para embutir na barra |
| `LeadCard.tsx` | Borda lateral para todos os níveis de urgência |


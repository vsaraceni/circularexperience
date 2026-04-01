

## Conflito de scroll vertical vs horizontal no Kanban

### Problema

O `handleWheel` atual sempre converte `deltaY` em scroll horizontal (`e.preventDefault()` + `scrollLeft += deltaY`). Quando o cursor está sobre uma coluna com cards que ultrapassam a altura visível, o scroll vertical da coluna é impedido — ou ambos acontecem simultaneamente.

### Como CRMs resolvem isso

**Trello/Linear/Notion**: scroll vertical dentro da coluna tem prioridade. Scroll horizontal só acontece via trackpad (gesto 2 dedos), setas, ou quando a coluna não tem mais conteúdo para scrollar verticalmente.

### 2 Soluções propostas

| # | Solução | Como funciona | Prós | Contras |
|---|---------|--------------|------|---------|
| **1** | **Scroll vertical prioritário** — horizontal só com Shift | Roda do mouse = scroll vertical na coluna. `Shift + roda` = scroll horizontal no board. Remover o `handleWheel` atual e deixar o comportamento nativo. | Comportamento mais natural e previsível, padrão em apps como Notion | Usuário precisa saber do Shift (mas é padrão de mercado) |
| **2** | **Detecção inteligente de contexto** — scroll vertical quando cursor está sobre coluna com overflow, horizontal quando está no "gap" entre colunas ou coluna sem overflow | Verificar se o `e.target` está dentro de uma coluna scrollável (`overflow-y: auto` com `scrollHeight > clientHeight`). Se sim, deixar o scroll vertical nativo. Se não (cursor no gap, header, ou coluna sem overflow), converter para horizontal. | Mais intuitivo, zero ação extra do usuário | Ligeiramente mais complexo, edge cases na borda da coluna |

### Recomendação

**Solução 2** — é a mais fluida. Quando o cursor está sobre os cards, scroll vertical funciona naturalmente. Quando está no espaço entre colunas ou em colunas sem overflow, scroll horizontal. As setas flutuantes continuam como fallback para qualquer cenário.

### Implementação (Solução 2)

**Arquivo**: `src/components/admin/KanbanBoard.tsx` — apenas o `handleWheel`

```text
handleWheel(e):
  1. Encontrar o elemento coluna scrollável mais próximo do e.target
     (subir DOM até achar um com classe 'crm-scrollbar' ou overflow-y)
  2. Se encontrou coluna E ela tem scrollHeight > clientHeight:
     - Se coluna NÃO está no limite (pode scrollar mais na direção do deltaY):
       → deixar scroll vertical nativo (NÃO chamar preventDefault)
       → return
  3. Senão (sem coluna, ou coluna no limite de scroll):
     → preventDefault + scrollLeft += deltaY (scroll horizontal)
```

Isso significa: scroll vertical dentro da coluna até bater no topo/fundo, depois "transborda" para scroll horizontal. Exatamente como Linear faz.

| Arquivo | Mudança |
|---------|---------|
| `KanbanBoard.tsx` | Reescrever `handleWheel` com detecção de contexto (~15 linhas) |


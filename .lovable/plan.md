

## Adicionar estado "Frio" (❄️) ao sistema de Calor

### Conceito

Adicionar o valor `0` ao campo `lead_heat` para representar um lead **frio** — resposta negativa, sem interesse, quase perdido. A escala passa a ser:

```text
Frio (0):   ❄️ (ícone de gelo azul, ou bolinha azul)
Calor 1:    🟡
Calor 2:    🟡🟠
Calor 3:    🟡🟠🔴
Sem definir: ○○○
```

Visualmente: um ícone de floco de neve (Snowflake do Lucide) em azul `#42A5F5` à esquerda das 3 bolinhas. Quando `lead_heat === 0`, o floco fica ativo (azul) e as bolinhas ficam apagadas. Clicar no floco alterna entre frio e nulo. Clicar em qualquer bolinha remove o estado frio.

### Implementação

**1. `HeatDots.tsx`** — Adicionar ícone Snowflake clicável antes das bolinhas
- Importar `Snowflake` do Lucide
- Quando `value === 0`: floco azul ativo, bolinhas apagadas
- Clicar no floco: se já é 0, volta a null; senão, seta 0
- Clicar em bolinha: comportamento atual (seta 1/2/3, remove o estado frio)

**2. `PriorityListView.tsx`** — Adicionar "❄️ Frio" como opção no filtro de Calor

**3. Nenhuma migração necessária** — o campo `lead_heat integer` já aceita 0

### Arquivos impactados

| Arquivo | Mudança |
|---|---|
| `src/components/admin/HeatDots.tsx` | Adicionar Snowflake para valor 0 |
| `src/components/admin/PriorityListView.tsx` | Adicionar "Frio" no filtro de calor |


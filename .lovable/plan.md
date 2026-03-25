

## Correção do Parse de Investimento — Suporte a Multiplicadores

### Problema

O campo investimento aceita texto livre como `"2x de R$ 28.000,00"`. A função `parseInvestment` remove tudo que não é dígito/vírgula/ponto, resultando em `"228000"` → `228.000` ao invés de `2 × 28.000 = 56.000`.

### Solução

Reescrever `parseInvestment` em `KanbanColumn.tsx` para detectar padrões de multiplicador **antes** de limpar o valor:

```text
Padrões reconhecidos:
  "2x de R$ 28.000,00"  →  regex: /(\d+)\s*x\s*/i  →  multiplier=2, value=28000
  "3x R$ 10.000"        →  multiplier=3, value=10000
  "R$ 28.000,00"         →  multiplier=1, value=28000
  "56000"                →  multiplier=1, value=56000
```

Lógica:
1. Procurar `(\d+)\s*x\s*` no início ou antes do valor monetário
2. Se encontrar, extrair multiplicador e remover do texto
3. Parsear o restante com a lógica atual (remover pontos de milhar, trocar vírgula por ponto decimal)
4. Retornar `multiplicador × valor`

### Arquivo impactado

| Arquivo | Mudança |
|---------|---------|
| `KanbanColumn.tsx` | Reescrever `parseInvestment` (~10 linhas) |

### Sem risco

- Não cria campos novos
- Se não houver multiplicador, o comportamento é idêntico ao atual (1 × valor)
- Funciona para qualquer proposta com ou sem o padrão `Nx`


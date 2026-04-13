

## Auto-fit Colunas + Badge "Welcome"

### Problema
A tabela usa `minWidth` fixo (soma dos `DEFAULT_COL_WIDTHS` = ~1270px) com `tableLayout: "fixed"`, o que ultrapassa a tela em notebooks. A badge "Boas-Vindas" quebra linha em telas menores.

### Solução

**1. Colunas auto-reguláveis**

- Trocar a abordagem de larguras fixas em pixels para **percentuais** ou `fr`-like
- Manter `tableLayout: "fixed"` mas usar `width: 100%` na tabela (em vez de `minWidth: totalMinWidth`)
- Converter `DEFAULT_COL_WIDTHS` de pixels absolutos para proporções relativas (ex: 180 de 1270 total ≈ 14%)
- Quando o usuário redimensiona uma coluna manualmente, guardar a proporção (não pixels), garantindo que a soma é sempre 100%
- Remover o `minWidth: totalMinWidth` da `<table>` — a tabela passa a se ajustar ao container
- Definir `minWidth: 50px` em cada `<th>` para evitar colapso total

**2. Badge "Boas-Vindas" → "Welcome"**

- Em `STAGE_LABELS`, trocar `boas_vindas: "Boas-Vindas"` para `boas_vindas: "Welcome"`

### Detalhes técnicos

- `DEFAULT_COL_WIDTHS` passa a ser frações (ex: `[14, 9.5, 9.5, 8.7, 6.3, 5.5, 6.3, 8.7, 12.6, 7.9, 11]` somando ~100)
- `colWidths` armazenado como percentuais
- No `<th>` e `<td>`: `style={{ width: colWidths[i] + '%' }}`
- O resize handle calcula delta como % da largura do container
- `localStorage` persiste as proporções (invalida cache antigo de pixels)

### Arquivo impactado

| Arquivo | Mudança |
|---|---|
| `src/components/admin/PriorityListView.tsx` | Converter larguras para %, remover minWidth da table, badge "Welcome" |




## Correções na To-Do List: Scroll, Valor e Coluna Origem

### Problemas

1. **Scroll não funciona**: O container pai em `Pipeline.tsx` (linha 559) tem `overflow-hidden` e o `PriorityListView` usa `flex-1 flex flex-col overflow-hidden min-h-0`, mas a tabela interna precisa que toda a cadeia de flex permita encolhimento. O problema principal é que o `ResizeHandle` calcula delta a partir de `DEFAULT_COL_WIDTHS` em vez dos widths atuais, e mais criticamente, o container da tabela (linha 422) pode não estar recebendo altura correta.

2. **Valor colapsado**: A coluna "Valor" tem largura default de apenas 100px (`DEFAULT_COL_WIDTHS[7]`), insuficiente para exibir valores como "R$ 28.000". O `parseFloat` na linha 246 também pode não parsear corretamente valores como "2x de R$ 28.000".

3. **Coluna Origem**: Precisa ser removida.

### Mudanças no arquivo `src/components/admin/PriorityListView.tsx`

**1. Remover coluna Origem**
- Remover do array `columns` (linha 378)
- Remover estado `filterOrigem` e referências
- Remover a `<td>` de origem (linhas 512-516)
- Atualizar `DEFAULT_COL_WIDTHS` de 10 para 9 colunas
- Atualizar `colSpan={10}` para `colSpan={9}`

**2. Aumentar largura da coluna Valor**
- Alterar `DEFAULT_COL_WIDTHS` para dar mais espaço ao Valor (de 100 → 140px)

**3. Corrigir parsing do valor da proposta**
- Usar a mesma lógica `parseInvestment` do KanbanColumn que trata multiplicadores ("2x de R$ 28.000")

**4. Garantir scroll funcional**
- Adicionar `min-h-0` ao container pai da tabela se necessário
- O container em linha 422 já tem `overflow-auto min-h-0`, mas o wrapper externo (linha 392) precisa garantir `min-h-0` na cadeia flex — já tem. Vou verificar se o `overflow-hidden` do Pipeline.tsx bloqueia. O container `flex-1 overflow-hidden` (Pipeline linha 559) deveria permitir que o filho gerencie seu próprio scroll. A cadeia parece correta. O problema real pode ser que `<table>` com `tableLayout: fixed` e `minWidth` está dentro de um `overflow-auto` div mas a div não recebe altura restrita. Vou garantir que o div da tabela use `overflow-auto` com height constraint correto.

### Resumo das alterações

| Arquivo | Mudança |
|---------|---------|
| `src/components/admin/PriorityListView.tsx` | Remover coluna Origem, aumentar largura do Valor, fix parsing investimento, garantir scroll |


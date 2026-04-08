

## Adicionar coluna Telefone na To-Do List

### Mudanças em `src/components/admin/PriorityListView.tsx`

**1. Adicionar coluna "Telefone" no array `columns` (após "Contato", posição 2)**
- Inserir `{ label: "Telefone", sortKey: undefined, filter: undefined }` na posição index 2

**2. Atualizar `DEFAULT_COL_WIDTHS`**
- Inserir 120px na posição index 2 para a nova coluna (total passa de 9 para 10 colunas)

**3. Adicionar `<td>` do telefone no corpo da tabela (após a td de Contato)**
- Exibir `row.lead.telefone` truncado
- No `onClick` da célula: parar propagação (`e.stopPropagation()`) e copiar para o clipboard a string formatada `"telefone, nome, empresa"` usando `navigator.clipboard.writeText()`
- Feedback visual: `toast.success("Copiado!")` via sonner
- Estilizar com `cursor-pointer` e hover sutil para indicar que é clicável

**4. Atualizar `colSpan` da linha vazia** de 9 para 10

### Comportamento do clique
- Clicar no telefone copia `"(11) 99999-9999, João Silva, Empresa XYZ"` para a área de transferência
- Clicar em qualquer outra coluna da linha continua abrindo o Drawer normalmente


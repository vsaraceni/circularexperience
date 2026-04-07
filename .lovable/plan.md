

## Correções: Scroll, Colunas Redimensionáveis e Valor da Proposta

### Problemas identificados

1. **Scroll não funciona**: O container externo usa `flex-1` mas falta `min-h-0` para permitir que o flex child encolha abaixo do conteúdo natural. Sem isso, a div cresce infinitamente e nunca ativa scroll.

2. **Colunas não redimensionáveis**: As larguras são fixas via classes (`w-[180px]`, etc.). O usuário não consegue ajustar.

3. **Valor da proposta**: A coluna "Valor" exibe apenas `lead.valor_proposta`. Para leads na etapa "proposta" que já têm uma proposta gerada, o valor do campo `investment` da tabela `proposals` não aparece.

### Solução

**Arquivo: `src/components/admin/PriorityListView.tsx`**

1. **Scroll** — Adicionar `min-h-0` no container flex (`flex-1 flex flex-col overflow-hidden min-h-0`) e no wrapper da tabela (`flex-1 overflow-auto min-h-0`).

2. **Colunas redimensionáveis** — Usar CSS nativo `resize: horizontal; overflow: hidden` nos `<th>` com um estilo `min-width` e `max-width`. Remover as classes `w-[Xpx]` fixas e usar `style={{ width, minWidth, maxWidth }}` para permitir que o browser aplique o resize handle nativo. Alternativa mais elegante: usar `column-resize` com cursor drag handle via `onMouseDown` no bordo direito de cada `<th>`.

   Abordagem escolhida: **drag handle manual** — um `<div>` invisível de 4px na borda direita de cada header que, ao arrastar, ajusta a largura da coluna via state `colWidths: number[]`. Isso é mais controlável e funciona melhor que o `resize` nativo em tabelas.

3. **Valor da proposta real** — No `useMemo` que constrói `rows`, criar um mapa `proposalValueByLead` a partir de `proposals`. Na coluna Valor, exibir: `proposals[lead_id].investment` (se existir e lead estiver em etapa "proposta" ou "nutricao") OU `lead.valor_proposta`. Se ambos existirem, priorizar o valor da proposta gerada. Adicionar label "(proposta)" em texto menor para diferenciar.

### Detalhes técnicos

**Scroll fix** (linhas 307 e 337):
```tsx
// Linha 307: adicionar min-h-0
<div className="flex-1 flex flex-col overflow-hidden min-h-0">

// Linha 337: adicionar min-h-0
<div className="flex-1 overflow-auto min-h-0 rounded-lg border" ...>
```

**Colunas redimensionáveis**:
- State: `const [colWidths, setColWidths] = useState<number[]>([180, 120, 110, 80, 80, 110, 160, 100, 80, 90])`
- Componente `ResizeHandle`: div absoluto à direita do `<th>`, `cursor: col-resize`, `onMouseDown` inicia tracking de `clientX`, `onMouseMove` ajusta largura, `onMouseUp` finaliza
- Cada `<th>` recebe `style={{ width: colWidths[i], minWidth: 60 }}` e `position: relative`
- A `<table>` recebe `style={{ minWidth: sum(colWidths) }}` e remove `w-full` para permitir scroll horizontal

**Valor da proposta**:
- `proposalMap`: `Record<string, string>` mapeando `lead_id → investment`
- Na célula Valor: se `proposalMap[lead.id]` existe, exibir o investment formatado com label "(proposta)"; senão, exibir `valor_proposta` do lead

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `src/components/admin/PriorityListView.tsx` | Fix scroll, colunas redimensionáveis, valor da proposta |

### Sem migração SQL

Dados de proposals já disponíveis via props.


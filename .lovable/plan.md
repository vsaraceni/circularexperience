

## Fix: TabsContent não ocupa área vertical completa

### Problema

O `TabsContent` do Radix usa `display: none` quando inativo, mas quando ativo não tem `display: flex` nem height para preencher o container. A classe `flex-1` no `TabsContent` não funciona porque o componente Radix não aplica `display: flex` por padrão — ele renderiza como `display: block`.

### Solução

Adicionar ao CSS global (ou via classes) que `TabsContent[data-state=active]` tenha `display: flex; flex-direction: column; flex: 1; min-height: 0`. Isso garante que cada aba ativa ocupe toda a área vertical disponível.

### Mudanças

**`src/components/ui/tabs.tsx`** — Atualizar o `TabsContent` para incluir classes de flex layout quando ativo:
- Adicionar `data-[state=active]:flex data-[state=active]:flex-col data-[state=active]:flex-1 data-[state=active]:min-h-0` ao className padrão do `TabsContent`

**`src/components/admin/LeadDrawer.tsx`** — Ajustar classes das 3 abas:
- **Resumo**: `className="flex-1 overflow-y-auto mt-4 pr-1"` → `className="overflow-y-auto mt-4 pr-1"` (flex-1 vem do TabsContent global)
- **Follow-ups**: `className="mt-4 flex flex-col flex-1 min-h-0"` → `className="mt-4 overflow-hidden"` (flex-col e flex-1 já vêm do TabsContent)
- **Atividades**: `className="mt-4 flex-1 overflow-y-auto space-y-4"` → `className="mt-4 overflow-y-auto space-y-4"`

Resultado: cada aba preenche todo o espaço vertical entre o `TabsList` e o footer fixo.


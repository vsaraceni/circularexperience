

## Fix: Edições de templates não persistem + pergunta sobre botão

### Problema

Todas as funções de mutação (`saveEdit`, `handleAdd`, `handleDelete`, `handleReorder`, `handleToggleActive`) invalidam a query key `["message_templates"]`, mas a página admin usa `useAllTemplatesAdmin()` que tem query key `["message_templates_admin"]`. Resultado: os dados salvam no banco, mas a lista na tela não atualiza — parece que a edição "não pegou".

### Solução

**Arquivo**: `src/pages/admin/Templates.tsx`

Trocar todas as 5 chamadas de `invalidateQueries` de:
```ts
queryClient.invalidateQueries({ queryKey: ["message_templates"] });
```
para:
```ts
queryClient.invalidateQueries({ queryKey: ["message_templates_admin"] });
```

Linhas afetadas: 56, 74, 82, 96, 105.

### Pergunta pendente

O usuário começou a dizer algo sobre o botão "Nova Template" mas a mensagem foi cortada. Vou perguntar o que ele quis dizer após implementar o fix.


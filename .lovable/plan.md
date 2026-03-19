

## Diagnóstico

O problema está no `RichTextEditor.tsx`. O `useEffect` que sincroniza o `value` (prop) com o editor Tiptap tem um array de dependências vazio (`[]`), ou seja, só roda na montagem inicial. Quando o botão "Importar" atualiza o estado `form.scope` ou `form.considerations`, o componente recebe o novo `value` mas o editor Tiptap ignora a mudança.

## Correção

**Arquivo:** `src/components/admin/RichTextEditor.tsx`

Adicionar `value` ao array de dependências do `useEffect` (linha 60), para que quando o valor externo mudar, o conteúdo do editor seja atualizado:

```tsx
// De:
useEffect(() => {
  if (editor && value !== editor.getHTML()) {
    editor.commands.setContent(value || "");
  }
}, []);

// Para:
useEffect(() => {
  if (editor && value !== editor.getHTML()) {
    editor.commands.setContent(value || "");
  }
}, [value, editor]);
```

**Impacto:** 1 linha alterada, sem efeitos colaterais — a comparação `value !== editor.getHTML()` já previne loops infinitos.

